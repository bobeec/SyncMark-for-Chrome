/**
 * SyncMark for Chrome - Background Script
 * Service Worker for Chrome Extension
 */

// Configuration
const CONFIG = {
  API_BASE_URL: 'http://localhost:3000/api', // Will be updated for production
  SYNC_INTERVAL: 300000, // 5 minutes
  STORAGE_KEYS: {
    SESSION_TOKEN: 'syncmark_session_token',
    USER_DATA: 'syncmark_user_data',
    LAST_SYNC: 'syncmark_last_sync',
    SETTINGS: 'syncmark_settings'
  }
}

// State management
let syncTimer = null
let isAuthenticated = false
let currentUser = null

/**
 * Initialize extension
 */
chrome.runtime.onStartup.addListener(async () => {
  console.log('SyncMark: Extension starting up')
  await initialize()
})

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('SyncMark: Extension installed/updated', details.reason)
  await initialize()
  
  if (details.reason === 'install') {
    // Open welcome page on first install
    chrome.tabs.create({
      url: 'http://localhost:3000'
    })
  }
})

/**
 * Initialize extension state
 */
async function initialize() {
  try {
    // Load stored session
    const result = await chrome.storage.local.get([
      CONFIG.STORAGE_KEYS.SESSION_TOKEN,
      CONFIG.STORAGE_KEYS.USER_DATA,
      CONFIG.STORAGE_KEYS.SETTINGS
    ])

    if (result[CONFIG.STORAGE_KEYS.SESSION_TOKEN]) {
      await verifySession(result[CONFIG.STORAGE_KEYS.SESSION_TOKEN])
    }

    // Set up periodic sync if authenticated
    if (isAuthenticated) {
      setupPeriodicSync()
    }

    console.log('SyncMark: Initialization complete')
  } catch (error) {
    console.error('SyncMark: Initialization failed:', error)
  }
}

/**
 * Verify session token with server
 */
async function verifySession(sessionToken) {
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/auth/verify`, {
      headers: {
        'X-Session-Token': sessionToken
      }
    })

    const result = await response.json()

    if (result.success) {
      isAuthenticated = true
      currentUser = result.user
      
      // Update storage
      await chrome.storage.local.set({
        [CONFIG.STORAGE_KEYS.SESSION_TOKEN]: sessionToken,
        [CONFIG.STORAGE_KEYS.USER_DATA]: currentUser
      })

      // Update badge
      updateBadge('✓', '#10b981') // Green checkmark

      return true
    } else {
      // Invalid session
      await clearAuth()
      return false
    }
  } catch (error) {
    console.error('SyncMark: Session verification failed:', error)
    updateBadge('!', '#ef4444') // Red exclamation
    return false
  }
}

/**
 * Clear authentication data
 */
async function clearAuth() {
  isAuthenticated = false
  currentUser = null
  
  await chrome.storage.local.remove([
    CONFIG.STORAGE_KEYS.SESSION_TOKEN,
    CONFIG.STORAGE_KEYS.USER_DATA
  ])

  // Stop periodic sync
  if (syncTimer) {
    clearInterval(syncTimer)
    syncTimer = null
  }

  updateBadge('', '')
}

/**
 * Setup periodic bookmark sync
 */
function setupPeriodicSync() {
  if (syncTimer) {
    clearInterval(syncTimer)
  }

  // Immediate sync
  performSync()

  // Periodic sync
  syncTimer = setInterval(performSync, CONFIG.SYNC_INTERVAL)
  console.log('SyncMark: Periodic sync enabled')
}

/**
 * Perform bookmark synchronization
 */
async function performSync() {
  if (!isAuthenticated) {
    console.log('SyncMark: Sync skipped - not authenticated')
    return
  }

  try {
    updateBadge('↻', '#3b82f6') // Blue sync icon

    // Get local bookmarks
    const localBookmarks = await getAllBookmarks()
    
    // Get last sync timestamp
    const result = await chrome.storage.local.get([CONFIG.STORAGE_KEYS.LAST_SYNC])
    const lastSync = result[CONFIG.STORAGE_KEYS.LAST_SYNC]

    // Get changes from server
    let serverData
    if (lastSync) {
      const response = await fetch(`${CONFIG.API_BASE_URL}/sync/changes?since=${encodeURIComponent(lastSync)}`, {
        headers: {
          'X-Session-Token': await getSessionToken()
        }
      })
      serverData = await response.json()
    } else {
      // Full sync for first time
      const response = await fetch(`${CONFIG.API_BASE_URL}/sync/full`, {
        headers: {
          'X-Session-Token': await getSessionToken()
        }
      })
      serverData = await response.json()
    }

    if (serverData.success) {
      // Apply server changes to local bookmarks
      await applyServerChanges(serverData.sync_data)

      // Detect local changes and push to server
      await pushLocalChanges(localBookmarks)

      // Update last sync timestamp
      await chrome.storage.local.set({
        [CONFIG.STORAGE_KEYS.LAST_SYNC]: new Date().toISOString()
      })

      updateBadge('✓', '#10b981') // Green checkmark
      console.log('SyncMark: Sync completed successfully')
    } else {
      throw new Error(serverData.error || 'Sync failed')
    }

  } catch (error) {
    console.error('SyncMark: Sync failed:', error)
    updateBadge('!', '#ef4444') // Red exclamation
  }
}

/**
 * Get all local bookmarks
 */
async function getAllBookmarks() {
  return new Promise((resolve) => {
    chrome.bookmarks.getTree((tree) => {
      const bookmarks = []
      
      function traverseNode(node, parentId = null) {
        if (node.url) {
          // It's a bookmark
          bookmarks.push({
            id: node.id,
            title: node.title,
            url: node.url,
            parentId: parentId,
            dateAdded: node.dateAdded
          })
        } else if (node.children) {
          // It's a folder, traverse children
          node.children.forEach(child => traverseNode(child, node.id))
        }
      }

      tree.forEach(root => {
        if (root.children) {
          root.children.forEach(child => traverseNode(child))
        }
      })

      resolve(bookmarks)
    })
  })
}

/**
 * Apply server changes to local bookmarks
 */
async function applyServerChanges(syncData) {
  // This is a simplified implementation
  // In a full version, we'd need conflict resolution
  console.log('SyncMark: Applying server changes:', syncData.bookmarks.length, 'bookmarks')
  
  // For MVP, we'll just log the changes
  // Full implementation would involve:
  // 1. Creating/updating folders
  // 2. Creating/updating bookmarks
  // 3. Handling deletions
  // 4. Conflict resolution
}

/**
 * Push local changes to server
 */
async function pushLocalChanges(localBookmarks) {
  // Simplified implementation for MVP
  console.log('SyncMark: Would push', localBookmarks.length, 'local bookmarks to server')
  
  // Full implementation would:
  // 1. Compare with last known state
  // 2. Identify changed/new/deleted items
  // 3. Send changes to server
}

/**
 * Get session token from storage
 */
async function getSessionToken() {
  const result = await chrome.storage.local.get([CONFIG.STORAGE_KEYS.SESSION_TOKEN])
  return result[CONFIG.STORAGE_KEYS.SESSION_TOKEN]
}

/**
 * Update extension badge
 */
function updateBadge(text, color) {
  chrome.action.setBadgeText({ text })
  if (color) {
    chrome.action.setBadgeBackgroundColor({ color })
  }
}

/**
 * Handle bookmark changes
 */
chrome.bookmarks.onCreated.addListener((id, bookmark) => {
  console.log('SyncMark: Bookmark created:', bookmark.title)
  if (isAuthenticated) {
    // Debounced sync - wait a bit in case of bulk operations
    setTimeout(performSync, 2000)
  }
})

chrome.bookmarks.onChanged.addListener((id, changeInfo) => {
  console.log('SyncMark: Bookmark changed:', id, changeInfo)
  if (isAuthenticated) {
    setTimeout(performSync, 2000)
  }
})

chrome.bookmarks.onRemoved.addListener((id, removeInfo) => {
  console.log('SyncMark: Bookmark removed:', id)
  if (isAuthenticated) {
    setTimeout(performSync, 2000)
  }
})

/**
 * Handle messages from popup/content scripts
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'getAuthStatus':
      sendResponse({
        isAuthenticated,
        user: currentUser
      })
      break

    case 'login':
      handleLogin(request.data)
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, error: error.message }))
      return true // Keep message channel open for async response

    case 'logout':
      handleLogout()
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }))
      return true

    case 'performSync':
      performSync()
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }))
      return true

    case 'addBookmark':
      handleAddBookmark(request.data)
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, error: error.message }))
      return true

    default:
      console.warn('SyncMark: Unknown message action:', request.action)
  }
})

/**
 * Handle login from popup
 */
async function handleLogin(data) {
  try {
    // send id_token when available (client will provide id_token), fall back to token for MVP
    const body = { }
    if (data && data.id_token) {
      body.id_token = data.id_token
    } else if (data && data.token) {
      body.token = data.token
    } else {
      body.token = 'mock-token'
    }

    const response = await fetch(`${CONFIG.API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    const result = await response.json()

    if (result.success) {
      isAuthenticated = true
      currentUser = result.user

      await chrome.storage.local.set({
        [CONFIG.STORAGE_KEYS.SESSION_TOKEN]: result.session_token,
        [CONFIG.STORAGE_KEYS.USER_DATA]: currentUser
      })

      setupPeriodicSync()
      
      return { success: true, user: currentUser }
    } else {
      throw new Error(result.error || 'Login failed')
    }
  } catch (error) {
    console.error('SyncMark: Login failed:', error)
    throw error
  }
}

/**
 * Handle logout from popup
 */
async function handleLogout() {
  try {
    const sessionToken = await getSessionToken()
    
    if (sessionToken) {
      await fetch(`${CONFIG.API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'X-Session-Token': sessionToken
        }
      })
    }

    await clearAuth()
  } catch (error) {
    console.error('SyncMark: Logout error:', error)
    // Clear local data anyway
    await clearAuth()
  }
}

/**
 * Handle add bookmark from context menu or page
 */
async function handleAddBookmark(data) {
  try {
    const sessionToken = await getSessionToken()
    
    if (!sessionToken) {
      throw new Error('Not authenticated')
    }

    const response = await fetch(`${CONFIG.API_BASE_URL}/bookmarks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken
      },
      body: JSON.stringify({
        title: data.title,
        url: data.url,
        description: data.description,
        folder_id: data.folder_id,
        tags: data.tags,
        is_favorite: data.is_favorite
      })
    })

    const result = await response.json()

    if (result.success) {
      console.log('SyncMark: Bookmark added successfully')
      return result
    } else {
      throw new Error(result.error || 'Failed to add bookmark')
    }
  } catch (error) {
    console.error('SyncMark: Add bookmark failed:', error)
    throw error
  }
}

console.log('SyncMark: Background script loaded')