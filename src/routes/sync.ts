import { Hono } from 'hono'
import { CloudflareBindings, BookmarkSyncData } from '../types'

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

// Get all data for sync (Chrome extension endpoint)
syncRoutes.get('/data', async (c) => {
  try {
    const userId = c.get('userId')
    const lastSync = c.req.query('last_sync')

    let bookmarkQuery = 'SELECT * FROM bookmarks WHERE user_id = ?'
    let folderQuery = 'SELECT * FROM folders WHERE user_id = ?'
    const params = [userId]

    // If last_sync provided, only get updated items
    if (lastSync) {
      bookmarkQuery += ' AND updated_at > ?'
      folderQuery += ' AND updated_at > ?'
    }

    bookmarkQuery += ' ORDER BY position ASC, created_at DESC'
    folderQuery += ' ORDER BY parent_id IS NULL DESC, position ASC'

    const [bookmarksResult, foldersResult] = await Promise.all([
      c.env.DB.prepare(bookmarkQuery).bind(...params, ...(lastSync ? [lastSync] : [])).all(),
      c.env.DB.prepare(folderQuery).bind(...params, ...(lastSync ? [lastSync] : [])).all()
    ])

    // Process bookmarks (parse tags JSON)
    const bookmarks = bookmarksResult.results.map((bookmark: any) => ({
      ...bookmark,
      tags: bookmark.tags ? JSON.parse(bookmark.tags) : [],
      is_favorite: Boolean(bookmark.is_favorite)
    }))

    const folders = foldersResult.results

    // Update last sync time
    await c.env.DB
      .prepare(`
        UPDATE sync_sessions 
        SET last_sync_at = CURRENT_TIMESTAMP 
        WHERE user_id = ?
      `)
      .bind(userId)
      .run()

    const syncData: BookmarkSyncData = {
      bookmarks,
      folders,
      deleted_bookmark_ids: [], // TODO: Implement soft delete tracking
      deleted_folder_ids: [], // TODO: Implement soft delete tracking
      timestamp: new Date().toISOString()
    }

    return c.json({
      success: true,
      data: syncData
    })

  } catch (error) {
    console.error('Sync data error:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to fetch sync data' 
    }, 500)
  }
})

// Bulk sync from Chrome extension
syncRoutes.post('/bulk', async (c) => {
  try {
    const userId = c.get('userId')
    const { bookmarks, folders, remove_bookmark_ids, remove_folder_ids } = await c.req.json()

    // Start transaction-like operations (D1 doesn't support transactions, so we'll do best effort)
    
    // 1. Remove deleted bookmarks
    if (remove_bookmark_ids && remove_bookmark_ids.length > 0) {
      const placeholders = remove_bookmark_ids.map(() => '?').join(',')
      await c.env.DB
        .prepare(`DELETE FROM bookmarks WHERE id IN (${placeholders}) AND user_id = ?`)
        .bind(...remove_bookmark_ids, userId)
        .run()
    }

    // 2. Remove deleted folders (check for children first)
    if (remove_folder_ids && remove_folder_ids.length > 0) {
      for (const folderId of remove_folder_ids) {
        // Move bookmarks in this folder to root
        await c.env.DB
          .prepare('UPDATE bookmarks SET folder_id = NULL WHERE folder_id = ? AND user_id = ?')
          .bind(folderId, userId)
          .run()
        
        // Move child folders to root
        await c.env.DB
          .prepare('UPDATE folders SET parent_id = NULL WHERE parent_id = ? AND user_id = ?')
          .bind(folderId, userId)
          .run()
        
        // Delete the folder
        await c.env.DB
          .prepare('DELETE FROM folders WHERE id = ? AND user_id = ?')
          .bind(folderId, userId)
          .run()
      }
    }

    // 3. Upsert folders
    if (folders && folders.length > 0) {
      for (const folder of folders) {
        if (folder.id) {
          // Update existing folder
          await c.env.DB
            .prepare(`
              UPDATE folders 
              SET name = ?, parent_id = ?, position = ?, updated_at = CURRENT_TIMESTAMP
              WHERE id = ? AND user_id = ?
            `)
            .bind(folder.name, folder.parent_id || null, folder.position || 0, folder.id, userId)
            .run()
        } else {
          // Create new folder
          await c.env.DB
            .prepare(`
              INSERT INTO folders (user_id, name, parent_id, position) 
              VALUES (?, ?, ?, ?)
            `)
            .bind(userId, folder.name, folder.parent_id || null, folder.position || 0)
            .run()
        }
      }
    }

    // 4. Upsert bookmarks
    if (bookmarks && bookmarks.length > 0) {
      for (const bookmark of bookmarks) {
        const tags = bookmark.tags ? JSON.stringify(bookmark.tags) : null
        
        if (bookmark.id) {
          // Update existing bookmark
          await c.env.DB
            .prepare(`
              UPDATE bookmarks 
              SET title = ?, url = ?, description = ?, folder_id = ?, position = ?, 
                  tags = ?, is_favorite = ?, visit_count = ?, last_visited_at = ?,
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = ? AND user_id = ?
            `)
            .bind(
              bookmark.title,
              bookmark.url,
              bookmark.description || null,
              bookmark.folder_id || null,
              bookmark.position || 0,
              tags,
              bookmark.is_favorite ? 1 : 0,
              bookmark.visit_count || 0,
              bookmark.last_visited_at || null,
              bookmark.id,
              userId
            )
            .run()
        } else {
          // Create new bookmark
          await c.env.DB
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
              bookmark.position || 0,
              tags,
              bookmark.is_favorite ? 1 : 0,
              bookmark.visit_count || 0,
              bookmark.last_visited_at || null
            )
            .run()
        }
      }
    }

    // Update sync session
    await c.env.DB
      .prepare(`
        UPDATE sync_sessions 
        SET last_sync_at = CURRENT_TIMESTAMP 
        WHERE user_id = ?
      `)
      .bind(userId)
      .run()

    return c.json({
      success: true,
      message: 'Bulk sync completed',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Bulk sync error:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to perform bulk sync' 
    }, 500)
  }
})

// Get sync status and statistics
syncRoutes.get('/status', async (c) => {
  try {
    const userId = c.get('userId')

    const session = await c.env.DB
      .prepare(`
        SELECT last_sync_at, device_info, created_at
        FROM sync_sessions 
        WHERE user_id = ? 
        ORDER BY last_sync_at DESC 
        LIMIT 1
      `)
      .bind(userId)
      .first()

    const stats = await c.env.DB
      .prepare(`
        SELECT 
          COUNT(CASE WHEN updated_at > ? THEN 1 END) as updated_bookmarks,
          COUNT(CASE WHEN created_at > ? THEN 1 END) as new_bookmarks
        FROM bookmarks 
        WHERE user_id = ?
      `)
      .bind(
        session?.last_sync_at || '1970-01-01',
        session?.last_sync_at || '1970-01-01',
        userId
      )
      .first()

    return c.json({
      success: true,
      status: {
        last_sync_at: session?.last_sync_at || null,
        device_info: session?.device_info ? JSON.parse(session.device_info) : null,
        session_created_at: session?.created_at || null,
        pending_changes: {
          updated_bookmarks: stats?.updated_bookmarks || 0,
          new_bookmarks: stats?.new_bookmarks || 0
        }
      }
    })

  } catch (error) {
    console.error('Sync status error:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to fetch sync status' 
    }, 500)
  }
})

// Manual sync trigger (for testing)
syncRoutes.post('/trigger', async (c) => {
  try {
    const userId = c.get('userId')

    // Update last sync time
    const result = await c.env.DB
      .prepare(`
        UPDATE sync_sessions 
        SET last_sync_at = CURRENT_TIMESTAMP 
        WHERE user_id = ?
      `)
      .bind(userId)
      .run()

    if (result.changes === 0) {
      return c.json({ 
        success: false, 
        error: 'No active sync session found' 
      }, 404)
    }

    return c.json({
      success: true,
      message: 'Sync triggered successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Sync trigger error:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to trigger sync' 
    }, 500)
  }
})

// Export bookmarks (for backup)
syncRoutes.get('/export', async (c) => {
  try {
    const userId = c.get('userId')
    const format = c.req.query('format') || 'json'

    const [bookmarksResult, foldersResult] = await Promise.all([
      c.env.DB
        .prepare('SELECT * FROM bookmarks WHERE user_id = ? ORDER BY folder_id, position')
        .bind(userId)
        .all(),
      c.env.DB
        .prepare('SELECT * FROM folders WHERE user_id = ? ORDER BY parent_id IS NULL DESC, position')
        .bind(userId)
        .all()
    ])

    const bookmarks = bookmarksResult.results.map((bookmark: any) => ({
      ...bookmark,
      tags: bookmark.tags ? JSON.parse(bookmark.tags) : [],
      is_favorite: Boolean(bookmark.is_favorite)
    }))

    const folders = foldersResult.results

    if (format === 'html') {
      // Generate HTML bookmarks file (compatible with browsers)
      let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>`

      // TODO: Implement proper HTML bookmark format with folder hierarchy
      bookmarks.forEach((bookmark: any) => {
        html += `
    <DT><A HREF="${bookmark.url}" ADD_DATE="${Math.floor(new Date(bookmark.created_at).getTime() / 1000)}">${bookmark.title}</A>`
        if (bookmark.description) {
          html += `
    <DD>${bookmark.description}`
        }
      })

      html += `
</DL><p>`

      return c.text(html, 200, {
        'Content-Type': 'text/html',
        'Content-Disposition': 'attachment; filename="bookmarks.html"'
      })
    }

    // Default: JSON format
    const exportData = {
      exported_at: new Date().toISOString(),
      version: '1.0',
      user_id: userId,
      folders,
      bookmarks
    }

    return c.json(exportData, 200, {
      'Content-Disposition': 'attachment; filename="bookmarks.json"'
    })

  } catch (error) {
    console.error('Export error:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to export bookmarks' 
    }, 500)
  }
})