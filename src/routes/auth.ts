import { Hono } from 'hono'
import { CloudflareBindings, User } from '../types'

export const authRoutes = new Hono<{ Bindings: CloudflareBindings }>()

// Mock Google OAuth for MVP (will be replaced with real OAuth later)
authRoutes.post('/google', async (c) => {
  try {
    // Accept either an ID token (from Google) or a legacy mock token for local testing
    const body = await c.req.json()
    const id_token = body?.id_token
    const token = body?.token

    let googleUser: any = null

    if (id_token) {
      const clientId = c.env.GOOGLE_CLIENT_ID
      if (!clientId) {
        console.error('GOOGLE_CLIENT_ID not configured in environment')
        return c.json({ success: false, error: 'Server misconfiguration' }, 500)
      }

      // Validate the ID token by calling Google's tokeninfo endpoint
      const tokenInfoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(id_token)}`)
      if (!tokenInfoRes.ok) {
        console.error('Invalid ID token, google tokeninfo returned', tokenInfoRes.status)
        return c.json({ success: false, error: 'Invalid ID token' }, 401)
      }

      const info = await tokenInfoRes.json() as any

      // Verify audience and issuer
      if (info.aud !== clientId) {
        console.error('ID token aud mismatch', info.aud, clientId)
        return c.json({ success: false, error: 'Invalid token audience' }, 401)
      }

      if (!['accounts.google.com', 'https://accounts.google.com'].includes(info.iss)) {
        console.error('Unexpected token issuer', info.iss)
        return c.json({ success: false, error: 'Invalid token issuer' }, 401)
      }

      // Extract user information from token info
      googleUser = {
        google_id: info.sub,
        email: info.email,
        name: info.name || info.email.split('@')[0],
        avatar_url: info.picture || null
      }
    } else if (token === 'mock-token') {
      // Legacy mock login for local testing
      googleUser = {
        google_id: 'mock-google-id-' + Date.now(),
        email: 'user@example.com',
        name: 'Test User',
        avatar_url: 'https://via.placeholder.com/40'
      }
    } else {
      return c.json({ success: false, error: 'No id_token provided' }, 400)
    }

    // Check if user exists
    const existingUser = await c.env.DB
      .prepare('SELECT * FROM users WHERE email = ?')
      .bind(googleUser.email)
      .first() as User | null

    let user: User

    if (existingUser) {
      user = existingUser
      await c.env.DB
        .prepare(`
          UPDATE users 
          SET google_id = ?, name = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `)
        .bind(googleUser.google_id, googleUser.name, googleUser.avatar_url, existingUser.id)
        .run()
    } else {
      const result = await c.env.DB
        .prepare(`
          INSERT INTO users (google_id, email, name, avatar_url) 
          VALUES (?, ?, ?, ?)
        `)
        .bind(
          googleUser.google_id,
          googleUser.email,
          googleUser.name,
          googleUser.avatar_url
        )
        .run()

      if (!result.success) {
        throw new Error('Failed to create user')
      }

      user = {
        id: result.meta.last_row_id as number,
        google_id: googleUser.google_id,
        email: googleUser.email,
        name: googleUser.name,
        avatar_url: googleUser.avatar_url,
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