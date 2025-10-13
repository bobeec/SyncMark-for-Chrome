import { Hono } from 'hono'
import { CloudflareBindings, Bookmark, CreateBookmarkRequest, UpdateBookmarkRequest } from '../types'

export const bookmarkRoutes = new Hono<{ Bindings: CloudflareBindings }>()

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

bookmarkRoutes.use('*', verifySession)

// Get all bookmarks for user
bookmarkRoutes.get('/', async (c) => {
  try {
    const userId = c.get('userId')
    const folderId = c.req.query('folder_id')
    const search = c.req.query('search')
    const sortBy = c.req.query('sort') || 'position'
    const favorites = c.req.query('favorites') === 'true'

    let query = `
      SELECT * FROM bookmarks 
      WHERE user_id = ?
    `
    const params = [userId]

    if (folderId) {
      query += ` AND folder_id = ?`
      params.push(folderId)
    }

    if (favorites) {
      query += ` AND is_favorite = 1`
    }

    if (search) {
      query += ` AND (title LIKE ? OR url LIKE ? OR description LIKE ?)`
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern, searchPattern)
    }

    // Add sorting
    switch (sortBy) {
      case 'title':
        query += ` ORDER BY title ASC`
        break
      case 'created_at':
        query += ` ORDER BY created_at DESC`
        break
      case 'last_visited_at':
        query += ` ORDER BY last_visited_at DESC NULLS LAST`
        break
      case 'visit_count':
        query += ` ORDER BY visit_count DESC`
        break
      default:
        query += ` ORDER BY position ASC, created_at DESC`
    }

    const bookmarks = await c.env.DB
      .prepare(query)
      .bind(...params)
      .all()

    // Parse tags JSON
    const processedBookmarks = bookmarks.results.map((bookmark: any) => ({
      ...bookmark,
      tags: bookmark.tags ? JSON.parse(bookmark.tags) : [],
      is_favorite: Boolean(bookmark.is_favorite)
    }))

    return c.json({
      success: true,
      bookmarks: processedBookmarks
    })

  } catch (error) {
    console.error('Get bookmarks error:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to fetch bookmarks' 
    }, 500)
  }
})

// Get single bookmark
bookmarkRoutes.get('/:id', async (c) => {
  try {
    const userId = c.get('userId')
    const bookmarkId = c.req.param('id')

    const bookmark = await c.env.DB
      .prepare('SELECT * FROM bookmarks WHERE id = ? AND user_id = ?')
      .bind(bookmarkId, userId)
      .first()

    if (!bookmark) {
      return c.json({ 
        success: false, 
        error: 'Bookmark not found' 
      }, 404)
    }

    return c.json({
      success: true,
      bookmark: {
        ...bookmark,
        tags: bookmark.tags ? JSON.parse(bookmark.tags) : [],
        is_favorite: Boolean(bookmark.is_favorite)
      }
    })

  } catch (error) {
    console.error('Get bookmark error:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to fetch bookmark' 
    }, 500)
  }
})

// Create new bookmark
bookmarkRoutes.post('/', async (c) => {
  try {
    const userId = c.get('userId')
    const data: CreateBookmarkRequest = await c.req.json()

    // Validate required fields
    if (!data.title || !data.url) {
      return c.json({ 
        success: false, 
        error: 'Title and URL are required' 
      }, 400)
    }

    // Get next position in folder
    const maxPosition = await c.env.DB
      .prepare(`
        SELECT COALESCE(MAX(position), 0) as max_pos 
        FROM bookmarks 
        WHERE user_id = ? AND folder_id ${data.folder_id ? '= ?' : 'IS NULL'}
      `)
      .bind(data.folder_id ? userId : userId, ...(data.folder_id ? [data.folder_id] : []))
      .first()

    const position = (maxPosition?.max_pos || 0) + 1

    const result = await c.env.DB
      .prepare(`
        INSERT INTO bookmarks 
        (user_id, folder_id, title, url, description, position, tags, is_favorite) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        userId,
        data.folder_id || null,
        data.title,
        data.url,
        data.description || null,
        position,
        data.tags ? JSON.stringify(data.tags) : null,
        data.is_favorite ? 1 : 0
      )
      .run()

    if (!result.success) {
      throw new Error('Failed to create bookmark')
    }

    return c.json({
      success: true,
      bookmark: {
        id: result.meta.last_row_id,
        user_id: userId,
        folder_id: data.folder_id || null,
        title: data.title,
        url: data.url,
        description: data.description || null,
        position,
        tags: data.tags || [],
        is_favorite: Boolean(data.is_favorite),
        visit_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Create bookmark error:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to create bookmark' 
    }, 500)
  }
})

// Update bookmark
bookmarkRoutes.put('/:id', async (c) => {
  try {
    const userId = c.get('userId')
    const bookmarkId = c.req.param('id')
    const data: UpdateBookmarkRequest = await c.req.json()

    // Check if bookmark exists and belongs to user
    const existingBookmark = await c.env.DB
      .prepare('SELECT * FROM bookmarks WHERE id = ? AND user_id = ?')
      .bind(bookmarkId, userId)
      .first()

    if (!existingBookmark) {
      return c.json({ 
        success: false, 
        error: 'Bookmark not found' 
      }, 404)
    }

    // Build update query dynamically
    const updates = []
    const params = []

    if (data.title !== undefined) {
      updates.push('title = ?')
      params.push(data.title)
    }
    if (data.url !== undefined) {
      updates.push('url = ?')
      params.push(data.url)
    }
    if (data.description !== undefined) {
      updates.push('description = ?')
      params.push(data.description)
    }
    if (data.folder_id !== undefined) {
      updates.push('folder_id = ?')
      params.push(data.folder_id)
    }
    if (data.position !== undefined) {
      updates.push('position = ?')
      params.push(data.position)
    }
    if (data.tags !== undefined) {
      updates.push('tags = ?')
      params.push(data.tags ? JSON.stringify(data.tags) : null)
    }
    if (data.is_favorite !== undefined) {
      updates.push('is_favorite = ?')
      params.push(data.is_favorite ? 1 : 0)
    }
    if (data.visit_count !== undefined) {
      updates.push('visit_count = ?')
      params.push(data.visit_count)
    }

    if (updates.length === 0) {
      return c.json({ 
        success: false, 
        error: 'No fields to update' 
      }, 400)
    }

    updates.push('updated_at = CURRENT_TIMESTAMP')
    params.push(bookmarkId, userId)

    const query = `
      UPDATE bookmarks 
      SET ${updates.join(', ')} 
      WHERE id = ? AND user_id = ?
    `

    const result = await c.env.DB
      .prepare(query)
      .bind(...params)
      .run()

    if (!result.success) {
      throw new Error('Failed to update bookmark')
    }

    return c.json({ success: true })

  } catch (error) {
    console.error('Update bookmark error:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to update bookmark' 
    }, 500)
  }
})

// Delete bookmark
bookmarkRoutes.delete('/:id', async (c) => {
  try {
    const userId = c.get('userId')
    const bookmarkId = c.req.param('id')

    const result = await c.env.DB
      .prepare('DELETE FROM bookmarks WHERE id = ? AND user_id = ?')
      .bind(bookmarkId, userId)
      .run()

    if (result.changes === 0) {
      return c.json({ 
        success: false, 
        error: 'Bookmark not found' 
      }, 404)
    }

    return c.json({ success: true })

  } catch (error) {
    console.error('Delete bookmark error:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to delete bookmark' 
    }, 500)
  }
})

// Update bookmark visit count (for Chrome extension)
bookmarkRoutes.post('/:id/visit', async (c) => {
  try {
    const userId = c.get('userId')
    const bookmarkId = c.req.param('id')

    const result = await c.env.DB
      .prepare(`
        UPDATE bookmarks 
        SET visit_count = visit_count + 1, 
            last_visited_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
      `)
      .bind(bookmarkId, userId)
      .run()

    if (result.changes === 0) {
      return c.json({ 
        success: false, 
        error: 'Bookmark not found' 
      }, 404)
    }

    return c.json({ success: true })

  } catch (error) {
    console.error('Visit bookmark error:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to update visit count' 
    }, 500)
  }
})

// Get bookmark statistics
bookmarkRoutes.get('/stats/summary', async (c) => {
  try {
    const userId = c.get('userId')

    const stats = await c.env.DB
      .prepare(`
        SELECT 
          COUNT(*) as total_bookmarks,
          COUNT(CASE WHEN is_favorite = 1 THEN 1 END) as total_favorites,
          MAX(last_visited_at) as last_activity
        FROM bookmarks 
        WHERE user_id = ?
      `)
      .bind(userId)
      .first()

    return c.json({
      success: true,
      stats: {
        total_bookmarks: stats?.total_bookmarks || 0,
        total_favorites: stats?.total_favorites || 0,
        last_activity: stats?.last_activity || null
      }
    })

  } catch (error) {
    console.error('Get stats error:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to fetch statistics' 
    }, 500)
  }
})