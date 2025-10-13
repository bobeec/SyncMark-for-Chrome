import { Hono } from 'hono'
import { CloudflareBindings, Folder, CreateFolderRequest } from '../types'

export const folderRoutes = new Hono<{ Bindings: CloudflareBindings }>()

// Middleware to verify session
const verifySession = async (c: any, next: any) => {
  const sessionToken = c.req.header('X-Session-Token')
  
  if (!sessionToken) {
    return c.json({ success: false, error: 'Authentication required' }, 401)
  }

  const session = await c.env.DB
    .prepare(`
      SELECT user_id FROM sync_sessions 
      WHERE session_token = ? AND expires_at > CURRENT_TIMESTAMP
    `)
    .bind(sessionToken)
    .first()

  if (!session) {
    return c.json({ success: false, error: 'Invalid or expired session' }, 401)
  }

  c.set('userId', session.user_id)
  await next()
}

folderRoutes.use('*', verifySession)

// Get all folders for user (with hierarchy)
folderRoutes.get('/', async (c) => {
  try {
    const userId = c.get('userId')

    const folders = await c.env.DB
      .prepare(`
        SELECT f.*, COUNT(b.id) as bookmark_count
        FROM folders f
        LEFT JOIN bookmarks b ON f.id = b.folder_id
        WHERE f.user_id = ?
        GROUP BY f.id
        ORDER BY f.parent_id IS NULL DESC, f.position ASC, f.name ASC
      `)
      .bind(userId)
      .all()

    // Build folder tree
    const folderMap = new Map<number, Folder & { bookmark_count: number }>()
    const rootFolders: (Folder & { bookmark_count: number })[] = []

    // First pass: create folder objects
    folders.results.forEach((folder: any) => {
      const folderObj = {
        ...folder,
        children: [] as Folder[],
        bookmark_count: folder.bookmark_count || 0
      }
      folderMap.set(folder.id, folderObj)
      
      if (!folder.parent_id) {
        rootFolders.push(folderObj)
      }
    })

    // Second pass: build hierarchy
    folders.results.forEach((folder: any) => {
      if (folder.parent_id) {
        const parent = folderMap.get(folder.parent_id)
        const child = folderMap.get(folder.id)
        if (parent && child) {
          parent.children = parent.children || []
          parent.children.push(child)
        }
      }
    })

    return c.json({
      success: true,
      folders: rootFolders
    })

  } catch (error) {
    console.error('Get folders error:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to fetch folders' 
    }, 500)
  }
})

// Get single folder
folderRoutes.get('/:id', async (c) => {
  try {
    const userId = c.get('userId')
    const folderId = c.req.param('id')

    const folder = await c.env.DB
      .prepare(`
        SELECT f.*, COUNT(b.id) as bookmark_count
        FROM folders f
        LEFT JOIN bookmarks b ON f.id = b.folder_id
        WHERE f.id = ? AND f.user_id = ?
        GROUP BY f.id
      `)
      .bind(folderId, userId)
      .first()

    if (!folder) {
      return c.json({ 
        success: false, 
        error: 'Folder not found' 
      }, 404)
    }

    return c.json({
      success: true,
      folder: {
        ...folder,
        bookmark_count: folder.bookmark_count || 0
      }
    })

  } catch (error) {
    console.error('Get folder error:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to fetch folder' 
    }, 500)
  }
})

// Create new folder
folderRoutes.post('/', async (c) => {
  try {
    const userId = c.get('userId')
    const data: CreateFolderRequest = await c.req.json()

    // Validate required fields
    if (!data.name || data.name.trim().length === 0) {
      return c.json({ 
        success: false, 
        error: 'Folder name is required' 
      }, 400)
    }

    // Check if parent folder exists (if specified)
    if (data.parent_id) {
      const parentFolder = await c.env.DB
        .prepare('SELECT id FROM folders WHERE id = ? AND user_id = ?')
        .bind(data.parent_id, userId)
        .first()

      if (!parentFolder) {
        return c.json({ 
          success: false, 
          error: 'Parent folder not found' 
        }, 400)
      }
    }

    // Get next position in parent folder
    const maxPosition = await c.env.DB
      .prepare(`
        SELECT COALESCE(MAX(position), 0) as max_pos 
        FROM folders 
        WHERE user_id = ? AND parent_id ${data.parent_id ? '= ?' : 'IS NULL'}
      `)
      .bind(...(data.parent_id ? [userId, data.parent_id] : [userId]))
      .first()

    const position = data.position !== undefined ? data.position : (maxPosition?.max_pos || 0) + 1

    const result = await c.env.DB
      .prepare(`
        INSERT INTO folders (user_id, name, parent_id, position) 
        VALUES (?, ?, ?, ?)
      `)
      .bind(userId, data.name.trim(), data.parent_id || null, position)
      .run()

    if (!result.success) {
      throw new Error('Failed to create folder')
    }

    return c.json({
      success: true,
      folder: {
        id: result.meta.last_row_id,
        user_id: userId,
        name: data.name.trim(),
        parent_id: data.parent_id || null,
        position,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        bookmark_count: 0
      }
    })

  } catch (error) {
    console.error('Create folder error:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to create folder' 
    }, 500)
  }
})

// Update folder
folderRoutes.put('/:id', async (c) => {
  try {
    const userId = c.get('userId')
    const folderId = c.req.param('id')
    const data = await c.req.json()

    // Check if folder exists and belongs to user
    const existingFolder = await c.env.DB
      .prepare('SELECT * FROM folders WHERE id = ? AND user_id = ?')
      .bind(folderId, userId)
      .first()

    if (!existingFolder) {
      return c.json({ 
        success: false, 
        error: 'Folder not found' 
      }, 404)
    }

    // Validate parent_id change (prevent circular reference)
    if (data.parent_id && data.parent_id !== existingFolder.parent_id) {
      // Check if new parent exists
      const parentFolder = await c.env.DB
        .prepare('SELECT id FROM folders WHERE id = ? AND user_id = ?')
        .bind(data.parent_id, userId)
        .first()

      if (!parentFolder) {
        return c.json({ 
          success: false, 
          error: 'Parent folder not found' 
        }, 400)
      }

      // Check for circular reference (simple check - folder can't be its own parent)
      if (data.parent_id === parseInt(folderId)) {
        return c.json({ 
          success: false, 
          error: 'Folder cannot be its own parent' 
        }, 400)
      }
    }

    // Build update query
    const updates = []
    const params = []

    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        return c.json({ 
          success: false, 
          error: 'Folder name is required' 
        }, 400)
      }
      updates.push('name = ?')
      params.push(data.name.trim())
    }

    if (data.parent_id !== undefined) {
      updates.push('parent_id = ?')
      params.push(data.parent_id)
    }

    if (data.position !== undefined) {
      updates.push('position = ?')
      params.push(data.position)
    }

    if (updates.length === 0) {
      return c.json({ 
        success: false, 
        error: 'No fields to update' 
      }, 400)
    }

    updates.push('updated_at = CURRENT_TIMESTAMP')
    params.push(folderId, userId)

    const query = `
      UPDATE folders 
      SET ${updates.join(', ')} 
      WHERE id = ? AND user_id = ?
    `

    const result = await c.env.DB
      .prepare(query)
      .bind(...params)
      .run()

    if (!result.success) {
      throw new Error('Failed to update folder')
    }

    return c.json({ success: true })

  } catch (error) {
    console.error('Update folder error:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to update folder' 
    }, 500)
  }
})

// Delete folder
folderRoutes.delete('/:id', async (c) => {
  try {
    const userId = c.get('userId')
    const folderId = c.req.param('id')

    // Check if folder has children
    const hasChildren = await c.env.DB
      .prepare('SELECT COUNT(*) as count FROM folders WHERE parent_id = ?')
      .bind(folderId)
      .first()

    if (hasChildren && hasChildren.count > 0) {
      return c.json({ 
        success: false, 
        error: 'Cannot delete folder that contains subfolders' 
      }, 400)
    }

    // Check if folder has bookmarks
    const hasBookmarks = await c.env.DB
      .prepare('SELECT COUNT(*) as count FROM bookmarks WHERE folder_id = ?')
      .bind(folderId)
      .first()

    if (hasBookmarks && hasBookmarks.count > 0) {
      return c.json({ 
        success: false, 
        error: 'Cannot delete folder that contains bookmarks' 
      }, 400)
    }

    const result = await c.env.DB
      .prepare('DELETE FROM folders WHERE id = ? AND user_id = ?')
      .bind(folderId, userId)
      .run()

    if (result.changes === 0) {
      return c.json({ 
        success: false, 
        error: 'Folder not found' 
      }, 404)
    }

    return c.json({ success: true })

  } catch (error) {
    console.error('Delete folder error:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to delete folder' 
    }, 500)
  }
})

// Move folder (change position)
folderRoutes.post('/:id/move', async (c) => {
  try {
    const userId = c.get('userId')
    const folderId = c.req.param('id')
    const { parent_id, position } = await c.req.json()

    // Check if folder exists and belongs to user
    const folder = await c.env.DB
      .prepare('SELECT * FROM folders WHERE id = ? AND user_id = ?')
      .bind(folderId, userId)
      .first()

    if (!folder) {
      return c.json({ 
        success: false, 
        error: 'Folder not found' 
      }, 404)
    }

    // Validate new parent (if specified)
    if (parent_id && parent_id !== folder.parent_id) {
      const parentExists = await c.env.DB
        .prepare('SELECT id FROM folders WHERE id = ? AND user_id = ?')
        .bind(parent_id, userId)
        .first()

      if (!parentExists) {
        return c.json({ 
          success: false, 
          error: 'Target parent folder not found' 
        }, 400)
      }

      // Prevent circular reference
      if (parent_id === parseInt(folderId)) {
        return c.json({ 
          success: false, 
          error: 'Folder cannot be its own parent' 
        }, 400)
      }
    }

    // Update folder position
    const result = await c.env.DB
      .prepare(`
        UPDATE folders 
        SET parent_id = ?, position = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
      `)
      .bind(parent_id || null, position || 0, folderId, userId)
      .run()

    if (!result.success) {
      throw new Error('Failed to move folder')
    }

    return c.json({ success: true })

  } catch (error) {
    console.error('Move folder error:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to move folder' 
    }, 500)
  }
})

// Get folder statistics
folderRoutes.get('/stats/summary', async (c) => {
  try {
    const userId = c.get('userId')

    const stats = await c.env.DB
      .prepare(`
        SELECT COUNT(*) as total_folders
        FROM folders 
        WHERE user_id = ?
      `)
      .bind(userId)
      .first()

    return c.json({
      success: true,
      stats: {
        total_folders: stats?.total_folders || 0
      }
    })

  } catch (error) {
    console.error('Get folder stats error:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to fetch folder statistics' 
    }, 500)
  }
})