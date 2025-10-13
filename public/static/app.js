/**
 * SyncMark for Chrome - Main Application
 * Frontend JavaScript for bookmark management
 */

class SyncMarkApp {
  constructor() {
    this.sessionToken = localStorage.getItem('syncmark_session_token')
    this.currentUser = null
    this.currentFolder = null
    this.bookmarks = []
    this.folders = []
    this.apiUrl = '/api'
    
    // Wait for i18n to initialize
    if (window.i18n) {
      this.init()
    } else {
      window.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => this.init(), 100) // Give i18n time to load
      })
    }
  }

  async init() {
    console.log('Initializing SyncMark for Chrome...')
    
    // Set up event listeners
    this.setupEventListeners()
    
    // Check authentication
    if (this.sessionToken) {
      await this.verifySession()
    }
    
    // Load initial data if authenticated
    if (this.currentUser) {
      await this.loadData()
    }
    
    console.log('SyncMark for Chrome initialized')
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

    // Action buttons
    const addBookmarkBtn = document.getElementById('add-bookmark-btn')
    const addFolderBtn = document.getElementById('add-folder-btn')
    const syncBtn = document.getElementById('sync-btn')
    const exportBtn = document.getElementById('export-btn')
    
    if (addBookmarkBtn) {
      addBookmarkBtn.addEventListener('click', () => this.showAddBookmarkModal())
    }
    
    if (addFolderBtn) {
      addFolderBtn.addEventListener('click', () => this.showAddFolderModal())
    }
    
    if (syncBtn) {
      syncBtn.addEventListener('click', () => this.performSync())
    }
    
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportData())
    }

    // Search and sort
    const searchInput = document.getElementById('search-input')
    const sortSelect = document.getElementById('sort-select')
    
    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value))
    }
    
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => this.handleSort(e.target.value))
    }

    // Extension notice
    const closeNotice = document.getElementById('close-notice')
    const installExtensionBtn = document.getElementById('install-extension-btn')
    
    if (closeNotice) {
      closeNotice.addEventListener('click', () => this.hideExtensionNotice())
    }
    
    if (installExtensionBtn) {
      installExtensionBtn.addEventListener('click', () => this.openExtensionStore())
    }

    // Language change event
    window.addEventListener('languageChanged', (e) => {
      console.log('Language changed to:', e.detail.language)
      this.updateDynamicContent()
    })
  }

  // Authentication methods
  async handleLogin() {
    try {
      // For MVP, use mock authentication
      const response = await fetch(`${this.apiUrl}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: 'mock-token' })
      })

      const result = await response.json()

      if (result.success) {
        this.sessionToken = result.session_token
        this.currentUser = result.user
        localStorage.setItem('syncmark_session_token', this.sessionToken)
        
        this.updateAuthUI()
        await this.loadData()
        this.showMessage('auth.loginSuccess', 'success')
      } else {
        this.showMessage('messages.error', 'error')
      }
    } catch (error) {
      console.error('Login error:', error)
      this.showMessage('messages.networkError', 'error')
    }
  }

  async handleLogout() {
    try {
      if (this.sessionToken) {
        await fetch(`${this.apiUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'X-Session-Token': this.sessionToken
          }
        })
      }

      this.sessionToken = null
      this.currentUser = null
      localStorage.removeItem('syncmark_session_token')
      
      this.updateAuthUI()
      this.clearData()
      this.showMessage('auth.logoutSuccess', 'success')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  async verifySession() {
    try {
      const response = await fetch(`${this.apiUrl}/auth/verify`, {
        headers: {
          'X-Session-Token': this.sessionToken
        }
      })

      const result = await response.json()

      if (result.success) {
        this.currentUser = result.user
        this.updateAuthUI()
        return true
      } else {
        this.sessionToken = null
        localStorage.removeItem('syncmark_session_token')
        return false
      }
    } catch (error) {
      console.error('Session verification error:', error)
      return false
    }
  }

  updateAuthUI() {
    const loginBtn = document.getElementById('login-btn')
    const userInfo = document.getElementById('user-info')
    const userAvatar = document.getElementById('user-avatar')
    const userName = document.getElementById('user-name')

    if (this.currentUser) {
      if (loginBtn) loginBtn.classList.add('hidden')
      if (userInfo) userInfo.classList.remove('hidden')
      
      if (userAvatar) userAvatar.src = this.currentUser.avatar_url || 'https://via.placeholder.com/32'
      if (userName) userName.textContent = this.currentUser.name
    } else {
      if (loginBtn) loginBtn.classList.remove('hidden')
      if (userInfo) userInfo.classList.add('hidden')
    }
  }

  // Data loading methods
  async loadData() {
    await Promise.all([
      this.loadBookmarks(),
      this.loadFolders(),
      this.loadStats()
    ])
  }

  async loadBookmarks(folderId = null, search = '', sort = 'position') {
    try {
      const params = new URLSearchParams()
      if (folderId) params.set('folder_id', folderId)
      if (search) params.set('search', search)
      if (sort) params.set('sort', sort)

      const response = await fetch(`${this.apiUrl}/bookmarks?${params}`, {
        headers: {
          'X-Session-Token': this.sessionToken
        }
      })

      const result = await response.json()

      if (result.success) {
        this.bookmarks = result.bookmarks
        this.renderBookmarks()
      }
    } catch (error) {
      console.error('Load bookmarks error:', error)
    }
  }

  async loadFolders() {
    try {
      const response = await fetch(`${this.apiUrl}/folders`, {
        headers: {
          'X-Session-Token': this.sessionToken
        }
      })

      const result = await response.json()

      if (result.success) {
        this.folders = result.folders
        this.renderFolders()
      }
    } catch (error) {
      console.error('Load folders error:', error)
    }
  }

  async loadStats() {
    try {
      const [bookmarkStats, folderStats, syncStatus] = await Promise.all([
        fetch(`${this.apiUrl}/bookmarks/stats/summary`, {
          headers: { 'X-Session-Token': this.sessionToken }
        }),
        fetch(`${this.apiUrl}/folders/stats/summary`, {
          headers: { 'X-Session-Token': this.sessionToken }
        }),
        fetch(`${this.apiUrl}/sync/status`, {
          headers: { 'X-Session-Token': this.sessionToken }
        })
      ])

      const [bookmarkResult, folderResult, syncResult] = await Promise.all([
        bookmarkStats.json(),
        folderStats.json(),
        syncStatus.json()
      ])

      this.updateStats(bookmarkResult, folderResult, syncResult)
    } catch (error) {
      console.error('Load stats error:', error)
    }
  }

  // Rendering methods
  renderBookmarks() {
    const container = document.getElementById('bookmarks-container')
    if (!container) return

    if (this.bookmarks.length === 0) {
      container.innerHTML = `
        <div class="text-gray-500 text-center py-8">
          <i class="fas fa-bookmark text-4xl mb-4"></i>
          <p class="text-lg" data-i18n="bookmarks.noBookmarks">No bookmarks found</p>
          <p class="text-sm mt-2" data-i18n="bookmarks.noBookmarksDesc">Click "Add Bookmark" to get started</p>
        </div>
      `
      // Re-apply i18n to new elements
      if (window.i18n) {
        window.i18n.updatePageContent()
      }
      return
    }

    const bookmarksHTML = this.bookmarks.map(bookmark => `
      <div class="bookmark-item border-b pb-4 mb-4 hover:bg-gray-50 p-3 rounded" data-bookmark-id="${bookmark.id}">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center space-x-2 mb-2">
              <img src="https://www.google.com/s2/favicons?domain=${new URL(bookmark.url).hostname}" 
                   class="w-4 h-4" alt="favicon" onerror="this.src='data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" fill=\"%23666\" viewBox=\"0 0 16 16\"><path d=\"M8 0C3.58 0 0 3.58 0 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zM8 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z\"/></svg>'">
              <a href="${bookmark.url}" target="_blank" class="text-blue-600 hover:text-blue-800 font-medium">
                ${this.escapeHtml(bookmark.title)}
              </a>
              ${bookmark.is_favorite ? '<i class="fas fa-star text-yellow-500"></i>' : ''}
            </div>
            
            <p class="text-gray-600 text-sm truncate">${bookmark.url}</p>
            
            ${bookmark.description ? `<p class="text-gray-500 text-sm mt-1">${this.escapeHtml(bookmark.description)}</p>` : ''}
            
            ${bookmark.tags && bookmark.tags.length > 0 ? `
              <div class="flex flex-wrap gap-1 mt-2">
                ${bookmark.tags.map(tag => `
                  <span class="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">${this.escapeHtml(tag)}</span>
                `).join('')}
              </div>
            ` : ''}
            
            <div class="flex items-center text-xs text-gray-400 mt-2 space-x-4">
              ${bookmark.visit_count > 0 ? `<span><i class="fas fa-eye"></i> ${bookmark.visit_count}</span>` : ''}
              ${bookmark.last_visited_at ? `<span><i class="fas fa-clock"></i> ${this.formatDate(bookmark.last_visited_at)}</span>` : ''}
              <span><i class="fas fa-calendar"></i> ${this.formatDate(bookmark.created_at)}</span>
            </div>
          </div>
          
          <div class="flex items-center space-x-2 ml-4">
            <button onclick="app.editBookmark(${bookmark.id})" class="text-gray-500 hover:text-blue-600">
              <i class="fas fa-edit"></i>
            </button>
            <button onclick="app.deleteBookmark(${bookmark.id})" class="text-gray-500 hover:text-red-600">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('')

    container.innerHTML = bookmarksHTML
  }

  renderFolders() {
    const container = document.getElementById('folder-tree')
    if (!container) return

    if (this.folders.length === 0) {
      container.innerHTML = `
        <div class="text-gray-500 text-center py-4">
          <i class="fas fa-folder-open text-3xl mb-2"></i>
          <p data-i18n="folders.noFolders">No folders</p>
        </div>
      `
      // Re-apply i18n to new elements
      if (window.i18n) {
        window.i18n.updatePageContent()
      }
      return
    }

    const renderFolderTree = (folders, level = 0) => {
      return folders.map(folder => `
        <div class="folder-item" data-folder-id="${folder.id}" style="margin-left: ${level * 16}px">
          <div class="flex items-center justify-between py-2 px-2 hover:bg-gray-100 rounded cursor-pointer" 
               onclick="app.selectFolder(${folder.id})">
            <div class="flex items-center space-x-2">
              <i class="fas fa-folder text-yellow-600"></i>
              <span class="text-sm font-medium">${this.escapeHtml(folder.name)}</span>
              ${folder.bookmark_count > 0 ? `<span class="text-xs text-gray-500">(${folder.bookmark_count})</span>` : ''}
            </div>
            <div class="flex items-center space-x-1">
              <button onclick="event.stopPropagation(); app.editFolder(${folder.id})" 
                      class="text-gray-400 hover:text-blue-600">
                <i class="fas fa-edit text-xs"></i>
              </button>
              <button onclick="event.stopPropagation(); app.deleteFolder(${folder.id})" 
                      class="text-gray-400 hover:text-red-600">
                <i class="fas fa-trash text-xs"></i>
              </button>
            </div>
          </div>
          ${folder.children && folder.children.length > 0 ? renderFolderTree(folder.children, level + 1) : ''}
        </div>
      `).join('')
    }

    // Add "All Bookmarks" option at the top
    const allBookmarksHTML = `
      <div class="folder-item" data-folder-id="">
        <div class="flex items-center justify-between py-2 px-2 hover:bg-gray-100 rounded cursor-pointer bg-blue-50" 
             onclick="app.selectFolder(null)">
          <div class="flex items-center space-x-2">
            <i class="fas fa-bookmark text-blue-600"></i>
            <span class="text-sm font-medium text-blue-600" data-i18n="bookmarks.allBookmarks">All Bookmarks</span>
          </div>
        </div>
      </div>
    `

    container.innerHTML = allBookmarksHTML + renderFolderTree(this.folders)
    
    // Re-apply i18n to new elements
    if (window.i18n) {
      window.i18n.updatePageContent()
    }
  }

  updateStats(bookmarkResult, folderResult, syncResult) {
    if (bookmarkResult.success) {
      const totalBookmarks = document.getElementById('total-bookmarks')
      const totalFavorites = document.getElementById('total-favorites')
      
      if (totalBookmarks) totalBookmarks.textContent = bookmarkResult.stats.total_bookmarks
      if (totalFavorites) totalFavorites.textContent = bookmarkResult.stats.total_favorites
    }

    if (folderResult.success) {
      const totalFolders = document.getElementById('total-folders')
      if (totalFolders) totalFolders.textContent = folderResult.stats.total_folders
    }

    if (syncResult.success) {
      const lastSync = document.getElementById('last-sync')
      if (lastSync) {
        const lastSyncTime = syncResult.status.last_sync_at
        if (lastSyncTime && window.i18n) {
          lastSync.textContent = window.i18n.formatTimeAgo(lastSyncTime)
        }
      }
    }
  }

  // Utility methods
  escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  formatDate(dateString) {
    if (window.i18n) {
      return window.i18n.formatTimeAgo(dateString)
    }
    return new Date(dateString).toLocaleDateString()
  }

  showMessage(messageKey, type = 'info') {
    const message = window.i18n ? window.i18n.t(messageKey) : messageKey
    
    // Create toast notification
    const toast = document.createElement('div')
    toast.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
      type === 'success' ? 'bg-green-600 text-white' :
      type === 'error' ? 'bg-red-600 text-white' :
      'bg-blue-600 text-white'
    }`
    
    toast.innerHTML = `
      <div class="flex items-center justify-between">
        <span>${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-white hover:text-gray-200">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `
    
    document.body.appendChild(toast)
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast)
      }
    }, 3000)
  }

  clearData() {
    this.bookmarks = []
    this.folders = []
    this.renderBookmarks()
    this.renderFolders()
    
    // Reset stats
    const stats = ['total-bookmarks', 'total-folders', 'total-favorites']
    stats.forEach(id => {
      const element = document.getElementById(id)
      if (element) element.textContent = '0'
    })
    
    const lastSync = document.getElementById('last-sync')
    if (lastSync && window.i18n) {
      lastSync.textContent = window.i18n.t('time.never')
    }
  }

  updateDynamicContent() {
    // Update placeholder texts that might not be caught by data-i18n
    const searchInput = document.getElementById('search-input')
    if (searchInput && window.i18n) {
      searchInput.placeholder = window.i18n.t('actions.search')
    }
  }

  // Placeholder methods for features to be implemented
  selectFolder(folderId) {
    this.currentFolder = folderId
    console.log('Selected folder:', folderId)
    // TODO: Implement folder selection
  }

  showAddBookmarkModal() {
    console.log('Add bookmark modal')
    // TODO: Implement add bookmark modal
  }

  showAddFolderModal() {
    console.log('Add folder modal')
    // TODO: Implement add folder modal
  }

  editBookmark(id) {
    console.log('Edit bookmark:', id)
    // TODO: Implement bookmark editing
  }

  deleteBookmark(id) {
    console.log('Delete bookmark:', id)
    // TODO: Implement bookmark deletion
  }

  editFolder(id) {
    console.log('Edit folder:', id)
    // TODO: Implement folder editing
  }

  deleteFolder(id) {
    console.log('Delete folder:', id)
    // TODO: Implement folder deletion
  }

  handleSearch(query) {
    console.log('Search:', query)
    // TODO: Implement search
  }

  handleSort(sortBy) {
    console.log('Sort by:', sortBy)
    // TODO: Implement sorting
  }

  performSync() {
    console.log('Performing sync')
    // TODO: Implement sync
  }

  exportData() {
    console.log('Export data')
    // TODO: Implement data export
  }

  hideExtensionNotice() {
    const notice = document.getElementById('extension-notice')
    if (notice) {
      notice.style.display = 'none'
    }
  }

  openExtensionStore() {
    // TODO: Open Chrome Web Store when extension is ready
    console.log('Open extension store')
  }
}

// Initialize app
window.app = new SyncMarkApp()