/**
 * SyncMark for Chrome Extension - Popup Script
 */

class SyncMarkPopup {
  constructor() {
    this.currentTab = null
    this.authStatus = { isAuthenticated: false, user: null }
    this.stats = { bookmarks: 0, folders: 0, favorites: 0, lastSync: null }
    
    this.init()
  }

  async init() {
    console.log('SyncMark Popup: Initializing...')
    
    // Get current tab info
    await this.getCurrentTab()
    
    // Setup event listeners
    this.setupEventListeners()
    
    // Load authentication status
    await this.loadAuthStatus()
    
    // Load stats if authenticated
    if (this.authStatus.isAuthenticated) {
      await this.loadStats()
      this.updateUI()
    }
    
    console.log('SyncMark Popup: Initialization complete')
  }

  async getCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      this.currentTab = tab
      this.updatePageInfo()
    } catch (error) {
      console.error('Failed to get current tab:', error)
    }
  }

  setupEventListeners() {
    // Authentication
    const loginBtn = document.getElementById('login-btn')
    const logoutBtn = document.getElementById('logout-btn')
    
    if (loginBtn) {
      loginBtn.addEventListener('click', () => this.handleLogin())
    }
    
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.handleLogout())
    }

    // Actions
    const syncBtn = document.getElementById('sync-btn')
    const addBookmarkBtn = document.getElementById('add-bookmark-btn')
    
    if (syncBtn) {
      syncBtn.addEventListener('click', () => this.handleSync())
    }
    
    if (addBookmarkBtn) {
      addBookmarkBtn.addEventListener('click', () => this.handleAddBookmark())
    }

    // Navigation buttons
    const openDashboardBtn = document.getElementById('open-dashboard-btn')
    const recentBookmarksBtn = document.getElementById('recent-bookmarks-btn')
    const favoritesBtn = document.getElementById('favorites-btn')
    const settingsBtn = document.getElementById('settings-btn')
    
    if (openDashboardBtn) {
      openDashboardBtn.addEventListener('click', () => this.openDashboard())
    }
    
    if (recentBookmarksBtn) {
      recentBookmarksBtn.addEventListener('click', () => this.openRecent())
    }
    
    if (favoritesBtn) {
      favoritesBtn.addEventListener('click', () => this.openFavorites())
    }
    
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => this.openSettings())
    }
  }

  async loadAuthStatus() {
    try {
      const response = await this.sendMessageToBackground('getAuthStatus')
      this.authStatus = response
      this.updateAuthUI()
    } catch (error) {
      console.error('Failed to load auth status:', error)
    }
  }

  async loadStats() {
    try {
      // This would normally come from the background script
      // For now, we'll use placeholder data
      this.stats = {
        bookmarks: Math.floor(Math.random() * 100),
        folders: Math.floor(Math.random() * 20),
        favorites: Math.floor(Math.random() * 30),
        lastSync: new Date(Date.now() - Math.floor(Math.random() * 3600000)).toISOString()
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  updateAuthUI() {
    const loginView = document.getElementById('login-view')
    const userView = document.getElementById('user-view')
    const statsSection = document.getElementById('stats-section')
    const pageSection = document.getElementById('page-section')
    const actionsSection = document.getElementById('actions-section')
    
    if (this.authStatus.isAuthenticated && this.authStatus.user) {
      // Show authenticated UI
      loginView?.classList.add('hidden')
      userView?.classList.remove('hidden')
      statsSection?.classList.remove('hidden')
      pageSection?.classList.remove('hidden')
      actionsSection?.classList.remove('hidden')
      
      // Update user info
      const userAvatar = document.getElementById('user-avatar')
      const userName = document.getElementById('user-name')
      const userEmail = document.getElementById('user-email')
      
      if (userAvatar) {
        userAvatar.src = this.authStatus.user.avatar_url || 'icons/icon-32.png'
      }
      if (userName) {
        userName.textContent = this.authStatus.user.name || 'User'
      }
      if (userEmail) {
        userEmail.textContent = this.authStatus.user.email || ''
      }
    } else {
      // Show login UI
      loginView?.classList.remove('hidden')
      userView?.classList.add('hidden')
      statsSection?.classList.add('hidden')
      pageSection?.classList.add('hidden')
      actionsSection?.classList.add('hidden')
    }
  }

  updateUI() {
    // Update stats
    const bookmarkCount = document.getElementById('bookmark-count')
    const folderCount = document.getElementById('folder-count')
    const syncText = document.getElementById('sync-text')
    
    if (bookmarkCount) {
      bookmarkCount.textContent = this.stats.bookmarks
    }
    if (folderCount) {
      folderCount.textContent = this.stats.folders
    }
    if (syncText && this.stats.lastSync) {
      syncText.textContent = window.i18n.formatTimeAgo(this.stats.lastSync)
    }
  }

  updatePageInfo() {
    if (!this.currentTab) return
    
    const pageFavicon = document.getElementById('page-favicon')
    const pageTitle = document.getElementById('page-title')
    const pageUrl = document.getElementById('page-url')
    
    if (pageFavicon) {
      pageFavicon.src = this.currentTab.favIconUrl || 'icons/icon-16.png'
    }
    if (pageTitle) {
      pageTitle.textContent = this.currentTab.title || 'Unknown Page'
      pageTitle.title = this.currentTab.title || ''
    }
    if (pageUrl) {
      pageUrl.textContent = this.currentTab.url || ''
      pageUrl.title = this.currentTab.url || ''
    }
  }

  async handleLogin() {
    try {
      this.showLoading(true)
      
      const response = await this.sendMessageToBackground('login', {
        token: 'mock-token' // For MVP
      })

      if (response.success) {
        this.authStatus = { isAuthenticated: true, user: response.user }
        this.updateAuthUI()
        await this.loadStats()
        this.updateUI()
        this.showMessage(window.i18n.t('auth.loginSuccess'), 'success')
      } else {
        throw new Error(response.error || 'Login failed')
      }
    } catch (error) {
      console.error('Login failed:', error)
      this.showMessage('Login failed: ' + error.message, 'error')
    } finally {
      this.showLoading(false)
    }
  }

  async handleLogout() {
    try {
      this.showLoading(true)
      
      const response = await this.sendMessageToBackground('logout')
      
      if (response.success) {
        this.authStatus = { isAuthenticated: false, user: null }
        this.updateAuthUI()
        this.showMessage(window.i18n.t('auth.logoutSuccess'), 'success')
      } else {
        throw new Error(response.error || 'Logout failed')
      }
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      this.showLoading(false)
    }
  }

  async handleSync() {
    try {
      const syncBtn = document.getElementById('sync-btn')
      const syncIcon = document.getElementById('sync-icon')
      
      if (syncBtn) syncBtn.disabled = true
      if (syncIcon) syncIcon.textContent = '⟳'
      
      const response = await this.sendMessageToBackground('performSync')
      
      if (response.success) {
        await this.loadStats()
        this.updateUI()
        this.showMessage(window.i18n.t('messages.syncComplete'), 'success')
      } else {
        throw new Error(response.error || 'Sync failed')
      }
    } catch (error) {
      console.error('Sync failed:', error)
      this.showMessage('Sync failed: ' + error.message, 'error')
    } finally {
      const syncBtn = document.getElementById('sync-btn')
      const syncIcon = document.getElementById('sync-icon')
      
      if (syncBtn) syncBtn.disabled = false
      if (syncIcon) syncIcon.textContent = '🔄'
    }
  }

  async handleAddBookmark() {
    if (!this.currentTab) return
    
    try {
      this.showLoading(true)
      
      const response = await this.sendMessageToBackground('addBookmark', {
        title: this.currentTab.title,
        url: this.currentTab.url,
        description: '',
        tags: [],
        is_favorite: false
      })

      if (response.success) {
        await this.loadStats()
        this.updateUI()
        this.showMessage(window.i18n.t('bookmarks.addBookmarkSuccess'), 'success')
      } else {
        throw new Error(response.error || 'Failed to add bookmark')
      }
    } catch (error) {
      console.error('Add bookmark failed:', error)
      this.showMessage('Add bookmark failed: ' + error.message, 'error')
    } finally {
      this.showLoading(false)
    }
  }

  openDashboard() {
    chrome.tabs.create({ url: 'http://localhost:3000' })
    window.close()
  }

  openRecent() {
    chrome.tabs.create({ url: 'http://localhost:3000?view=recent' })
    window.close()
  }

  openFavorites() {
    chrome.tabs.create({ url: 'http://localhost:3000?view=favorites' })
    window.close()
  }

  openSettings() {
    chrome.tabs.create({ url: chrome.runtime.getURL('options.html') })
    window.close()
  }

  async sendMessageToBackground(action, data = null) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action, data }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
        } else {
          resolve(response)
        }
      })
    })
  }

  showLoading(show) {
    const overlay = document.getElementById('loading-overlay')
    if (overlay) {
      overlay.classList.toggle('hidden', !show)
    }
  }

  showMessage(message, type = 'info') {
    // Create a simple toast notification
    const toast = document.createElement('div')
    toast.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      padding: 12px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      z-index: 10000;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      ${type === 'success' ? 'background: #10b981; color: white;' : ''}
      ${type === 'error' ? 'background: #ef4444; color: white;' : ''}
      ${type === 'info' ? 'background: #3b82f6; color: white;' : ''}
    `
    
    toast.textContent = message
    document.body.appendChild(toast)
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast)
      }
    }, 3000)
  }
}

// Initialize popup when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new SyncMarkPopup()
  })
} else {
  new SyncMarkPopup()
}