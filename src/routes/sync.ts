import { Hono } from 'hono'
import { CloudflareBindings, BookmarkSyncData, Bookmark, Folder } from '../types'

export const syncRoutes = new Hono<{ Bindings: CloudflareBindings }>()

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

syncRoutes.use('*', verifySession)

// Get full sync data for Chrome extension
syncRoutes.get('/full', async (c) => {
  try {
    const userId = c.get('userId')

    // Get all folders with hierarchy
    const foldersResult = await c.env.DB
      .prepare(`
        SELECT * FROM folders 
        WHERE user_id = ? 
        ORDER BY parent_id IS NULL DESC, position ASC, name ASC
      `)
      .bind(userId)
      .all()

    // Get all bookmarks
    const bookmarksResult = await c.env.DB
      .prepare(`
        SELECT * FROM bookmarks 
        WHERE user_id = ? 
        ORDER BY folder_id, position ASC, created_at DESC
      `)
      .bind(userId)
      .all()

    // Process bookmarks (parse tags)
    const bookmarks = bookmarksResult.results.map((bookmark: any) => ({
      ...bookmark,
      tags: bookmark.tags ? JSON.parse(bookmark.tags) : [],
      is_favorite: Boolean(bookmark.is_favorite)
    }))

    const folders = foldersResult.results as Folder[]

    const syncData: BookmarkSyncData = {
      bookmarks,
      folders,
      deleted_bookmark_ids: [],
      deleted_folder_ids: [],
      timestamp: new Date().toISOString()
    }

    return c.json({
      success: true,
      sync_data: syncData
    })

  } catch (error) {
    console.error('Full sync error:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to get sync data' 
    }, 500)
  }
})

// Incremental sync (get changes since timestamp)
syncRoutes.get('/changes', async (c) => {
  try {
    const userId = c.get('userId')
    const since = c.req.query('since') // ISO timestamp
    
    if (!since) {
      return c.json({ 
        success: false, 
        error: 'Missing since parameter' 
      }, 400)
    }

    // Get updated bookmarks
    const bookmarksResult = await c.env.DB
      .prepare(`
        SELECT * FROM bookmarks 
        WHERE user_id = ? AND updated_at > ? 
        ORDER BY updated_at ASC
      `)
      .bind(userId, since)
      .all()

    // Get updated folders
    const foldersResult = await c.env.DB
      .prepare(`
        SELECT * FROM folders 
        WHERE user_id = ? AND updated_at > ? 
        ORDER BY updated_at ASC
      `)
      .bind(userId, since)
      .all()

    // Process bookmarks
    const bookmarks = bookmarksResult.results.map((bookmark: any) => ({
      ...bookmark,
      tags: bookmark.tags ? JSON.parse(bookmark.tags) : [],
      is_favorite: Boolean(bookmark.is_favorite)
    }))

    const folders = foldersResult.results as Folder[]

    const syncData: BookmarkSyncData = {
      bookmarks,
      folders,
      deleted_bookmark_ids: [], // TODO: Implement soft delete tracking
      deleted_folder_ids: [], // TODO: Implement soft delete tracking
      timestamp: new Date().toISOString()
    }

    return c.json({
      success: true,
      sync_data: syncData,
      has_changes: bookmarks.length > 0 || folders.length > 0
    })

  } catch (error) {
    console.error('Incremental sync error:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to get changes' 
    }, 500)
  }
})

// Push changes from Chrome extension
syncRoutes.post('/push', async (c) => {
  try {
    const userId = c.get('userId')
    const data: BookmarkSyncData = await c.req.json()

    // Start transaction (Note: D1 doesn't support transactions yet, so we'll do individual operations)
    const results = {
      bookmarks_created: 0,
      bookmarks_updated: 0,
      folders_created: 0,
      folders_updated: 0,
      errors: [] as string[]
    }

    // Process folders first (to ensure parent folders exist)
    for (const folder of data.folders) {
      try {
        if (folder.id && folder.id > 0) {
          // Update existing folder
          const result = await c.env.DB
            .prepare(`
              UPDATE folders 
              SET name = ?, parent_id = ?, position = ?, updated_at = CURRENT_TIMESTAMP
              WHERE id = ? AND user_id = ?
            `)
            .bind(folder.name, folder.parent_id || null, folder.position, folder.id, userId)
            .run()
          
          if (result.changes > 0) {
            results.folders_updated++
          }
        } else {
          // Create new folder
          const result = await c.env.DB
            .prepare(`
              INSERT INTO folders (user_id, name, parent_id, position) 
              VALUES (?, ?, ?, ?)
            `)
            .bind(userId, folder.name, folder.parent_id || null, folder.position)
            .run()
          
          if (result.success) {
            results.folders_created++
          }
        }
      } catch (error) {
        results.errors.push(`Folder ${folder.name}: ${error}`)
      }
    }

    // Process bookmarks
    for (const bookmark of data.bookmarks) {
      try {
        if (bookmark.id && bookmark.id > 0) {
          // Update existing bookmark
          const result = await c.env.DB
            .prepare(`
              UPDATE bookmarks 
              SET title = ?, url = ?, description = ?, folder_id = ?, 
                  position = ?, tags = ?, is_favorite = ?, 
                  visit_count = ?, last_visited_at = ?, updated_at = CURRENT_TIMESTAMP
              WHERE id = ? AND user_id = ?
            `)
            .bind(
              bookmark.title,
              bookmark.url,
              bookmark.description || null,
              bookmark.folder_id || null,
              bookmark.position,
              bookmark.tags ? JSON.stringify(bookmark.tags) : null,
              bookmark.is_favorite ? 1 : 0,
              bookmark.visit_count || 0,
              bookmark.last_visited_at || null,
              bookmark.id,
              userId
            )
            .run()
          
          if (result.changes > 0) {
            results.bookmarks_updated++
          }
        } else {
          // Create new bookmark
          const result = await c.env.DB
            .prepare(`
              INSERT INTO bookmarks 
              (user_id, title, url, description, folder_id, position, tags, is_favorite, visit_count, last_visited_at) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `)
            .bind(
              userId,
              bookmark.title,
              bookmark.url,
              bookmark.description || null,
              bookmark.folder_id || null,
              bookmark.position,
              bookmark.tags ? JSON.stringify(bookmark.tags) : null,
              bookmark.is_favorite ? 1 : 0,
              bookmark.visit_count || 0,
              bookmark.last_visited_at || null
            )
            .run()
          
          if (result.success) {
            results.bookmarks_created++
          }
        }
      } catch (error) {
        results.errors.push(`Bookmark ${bookmark.title}: ${error}`)
      }
    }

    // TODO: Handle deleted items when implementing soft delete

    // Update sync session timestamp
    const sessionToken = c.req.header('X-Session-Token')
    await c.env.DB
      .prepare('UPDATE sync_sessions SET last_sync_at = CURRENT_TIMESTAMP WHERE session_token = ?')
      .bind(sessionToken)
      .run()

    return c.json({
      success: true,
      results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Push sync error:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to push changes' 
    }, 500)
  }
})

// Get sync status
syncRoutes.get('/status', async (c) => {
  try {
    const userId = c.get('userId')
    const sessionToken = c.req.header('X-Session-Token')

    // Get sync session info
    const session = await c.env.DB
      .prepare(`
        SELECT last_sync_at, device_info 
        FROM sync_sessions 
        WHERE session_token = ?
      `)
      .bind(sessionToken)
      .first()

    // Get data counts
    const stats = await c.env.DB
      .prepare(`
        SELECT 
          (SELECT COUNT(*) FROM bookmarks WHERE user_id = ?) as bookmark_count,
          (SELECT COUNT(*) FROM folders WHERE user_id = ?) as folder_count,
          (SELECT COUNT(*) FROM bookmarks WHERE user_id = ? AND is_favorite = 1) as favorite_count
      `)
      .bind(userId, userId, userId)
      .first()

    return c.json({
      success: true,
      status: {
        last_sync_at: session?.last_sync_at || null,
        device_info: session?.device_info ? JSON.parse(session.device_info) : null,
        bookmark_count: stats?.bookmark_count || 0,
        folder_count: stats?.folder_count || 0,
        favorite_count: stats?.favorite_count || 0
      }
    })

  } catch (error) {
    console.error('Sync status error:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to get sync status' 
    }, 500)
  }
})