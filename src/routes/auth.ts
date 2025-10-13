import { Hono } from 'hono'
import { CloudflareBindings, User } from '../types'

export const authRoutes = new Hono<{ Bindings: CloudflareBindings }>()

// Mock Google OAuth for MVP (will be replaced with real OAuth later)
authRoutes.post('/google', async (c) => {
  try {
    const { token } = await c.req.json()
    
    // In MVP, we'll use mock data
    // TODO: Implement real Google OAuth verification
    const mockGoogleUser = {
      google_id: 'mock-google-id-' + Date.now(),
      email: 'user@example.com',
      name: 'Test User',
      avatar_url: 'https://via.placeholder.com/40'
    }

    // Check if user exists
    const existingUser = await c.env.DB
      .prepare('SELECT * FROM users WHERE email = ?')
      .bind(mockGoogleUser.email)
      .first() as User | null

    let user: User
    
    if (existingUser) {
      // Update existing user
      user = existingUser
      await c.env.DB
        .prepare(`
          UPDATE users 
          SET name = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `)
        .bind(mockGoogleUser.name, mockGoogleUser.avatar_url, existingUser.id)
        .run()
    } else {
      // Create new user
      const result = await c.env.DB
        .prepare(`
          INSERT INTO users (google_id, email, name, avatar_url) 
          VALUES (?, ?, ?, ?)
        `)
        .bind(
          mockGoogleUser.google_id,
          mockGoogleUser.email,
          mockGoogleUser.name,
          mockGoogleUser.avatar_url
        )
        .run()

      if (!result.success) {
        throw new Error('Failed to create user')
      }

      user = {
        id: result.meta.last_row_id as number,
        google_id: mockGoogleUser.google_id,
        email: mockGoogleUser.email,
        name: mockGoogleUser.name,
        avatar_url: mockGoogleUser.avatar_url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }

    // Generate session token
    const sessionToken = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(7)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Create sync session
    await c.env.DB
      .prepare(`
        INSERT INTO sync_sessions (user_id, session_token, expires_at, device_info) 
        VALUES (?, ?, ?, ?)
      `)
      .bind(
        user.id,
        sessionToken,
        expiresAt.toISOString(),
        JSON.stringify({ userAgent: c.req.header('User-Agent') })
      )
      .run()

    return c.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url
      },
      session_token: sessionToken,
      expires_at: expiresAt.toISOString()
    })

  } catch (error) {
    console.error('Auth error:', error)
    return c.json({ 
      success: false, 
      error: 'Authentication failed' 
    }, 500)
  }
})

// Verify session token
authRoutes.get('/verify', async (c) => {
  try {
    const sessionToken = c.req.header('X-Session-Token')
    
    if (!sessionToken) {
      return c.json({ success: false, error: 'No session token' }, 401)
    }

    const session = await c.env.DB
      .prepare(`
        SELECT s.*, u.id as user_id, u.email, u.name, u.avatar_url
        FROM sync_sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.session_token = ? AND s.expires_at > CURRENT_TIMESTAMP
      `)
      .bind(sessionToken)
      .first()

    if (!session) {
      return c.json({ success: false, error: 'Invalid or expired session' }, 401)
    }

    // Update last sync time
    await c.env.DB
      .prepare('UPDATE sync_sessions SET last_sync_at = CURRENT_TIMESTAMP WHERE session_token = ?')
      .bind(sessionToken)
      .run()

    return c.json({
      success: true,
      user: {
        id: session.user_id,
        email: session.email,
        name: session.name,
        avatar_url: session.avatar_url
      }
    })

  } catch (error) {
    console.error('Verify error:', error)
    return c.json({ 
      success: false, 
      error: 'Verification failed' 
    }, 500)
  }
})

// Logout
authRoutes.post('/logout', async (c) => {
  try {
    const sessionToken = c.req.header('X-Session-Token')
    
    if (sessionToken) {
      // Delete session
      await c.env.DB
        .prepare('DELETE FROM sync_sessions WHERE session_token = ?')
        .bind(sessionToken)
        .run()
    }

    return c.json({ success: true })

  } catch (error) {
    console.error('Logout error:', error)
    return c.json({ 
      success: false, 
      error: 'Logout failed' 
    }, 500)
  }
})