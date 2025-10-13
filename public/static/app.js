// Bookmark Manager - Frontend JavaScript
class BookmarkManager {
  constructor() {
    this.sessionToken = localStorage.getItem('session_token')
    this.currentUser = null
    this.currentFolder = null
    this.bookmarks = []
    this.folders = []
    
    this.init()
  }

  async init() {
    this.setupEventListeners()
    
    // Check if user is logged in
    if (this.sessionToken) {
      const isValid = await this.verifySession()
      if (isValid) {
        this.showLoggedInState()
        await this.loadData()
      } else {
        this.logout()
      }
    }
  }

  setupEventListeners() {
    // Auth buttons
    document.getElementById('login-btn')?.addEventListener('click', () => this.login())
    document.getElementById('logout-btn')?.addEventListener('click', () => this.logout())
    
    // Action buttons
    document.getElementById('add-bookmark-btn')?.addEventListener('click', () => this.showAddBookmarkModal())
    document.getElementById('add-folder-btn')?.addEventListener('click', () => this.showAddFolderModal())
    document.getElementById('sync-btn')?.addEventListener('click', () => this.syncData())
    document.getElementById('export-btn')?.addEventListener('click', () => this.exportBookmarks())
    
    // Search and sort
    document.getElementById('search-input')?.addEventListener('input', (e) => this.searchBookmarks(e.target.value))
    document.getElementById('sort-select')?.addEventListener('change', (e) => this.sortBookmarks(e.target.value))
    
    // Extension notice
    document.getElementById('close-notice')?.addEventListener('click', () => {
      document.getElementById('extension-notice').style.display = 'none'
    })
    document.getElementById('install-extension-btn')?.addEventListener('click', () => {
      alert('Chrome拡張機能のインストール方法:\\n1. extension/build/フォルダをzip圧縮\\n2. chrome://extensions/ で「デベロッパーモード」を有効\\n3. 「パッケージ化されていない拡張機能を読み込む」をクリック')
    })
  }

  // Authentication
  async login() {
    try {
      // Mock login for MVP - replace with real Google OAuth
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: 'mock-token' })
      })

      const result = await response.json()
      
      if (result.success) {
        this.sessionToken = result.session_token
        this.currentUser = result.user
        localStorage.setItem('session_token', this.sessionToken)
        
        this.showLoggedInState()
        await this.loadData()
        this.showMessage('ログインしました', 'success')
      } else {
        this.showMessage('ログインに失敗しました: ' + result.error, 'error')
      }
    } catch (error) {
      console.error('Login error:', error)
      this.showMessage('ログインエラーが発生しました', 'error')
    }
  }

  async verifySession() {
    try {
      const response = await fetch('/api/auth/verify', {
        headers: {
          'X-Session-Token': this.sessionToken
        }
      })

      const result = await response.json()
      
      if (result.success) {
        this.currentUser = result.user
        return true
      }
      return false
    } catch (error) {
      console.error('Verify session error:', error)
      return false
    }
  }

  logout() {
    this.sessionToken = null
    this.currentUser = null
    localStorage.removeItem('session_token')
    
    // Reset UI
    document.getElementById('login-btn').classList.remove('hidden')
    document.getElementById('user-info').classList.add('hidden')
    
    // Clear data
    this.bookmarks = []
    this.folders = []
    this.updateBookmarksDisplay()
    this.updateFoldersDisplay()
    this.updateStatistics()
    
    this.showMessage('ログアウトしました', 'info')
  }

  showLoggedInState() {
    document.getElementById('login-btn').classList.add('hidden')
    document.getElementById('user-info').classList.remove('hidden')
    
    if (this.currentUser) {
      document.getElementById('user-name').textContent = this.currentUser.name
      if (this.currentUser.avatar_url) {
        document.getElementById('user-avatar').src = this.currentUser.avatar_url
      }
    }
  }

  // Data loading
  async loadData() {
    try {
      await Promise.all([
        this.loadBookmarks(),
        this.loadFolders()
      ])
      this.updateStatistics()
    } catch (error) {
      console.error('Load data error:', error)
      this.showMessage('データの読み込みに失敗しました', 'error')
    }
  }

  async loadBookmarks(folderId = null, search = '') {
    try {
      const params = new URLSearchParams()
      if (folderId) params.set('folder_id', folderId)
      if (search) params.set('search', search)

      const response = await fetch('/api/bookmarks?' + params.toString(), {
        headers: {
          'X-Session-Token': this.sessionToken
        }
      })

      const result = await response.json()
      
      if (result.success) {
        this.bookmarks = result.bookmarks
        this.updateBookmarksDisplay()
      }
    } catch (error) {
      console.error('Load bookmarks error:', error)
    }
  }

  async loadFolders() {
    try {
      const response = await fetch('/api/folders', {
        headers: {
          'X-Session-Token': this.sessionToken
        }
      })

      const result = await response.json()
      
      if (result.success) {
        this.folders = result.folders
        this.updateFoldersDisplay()
      }
    } catch (error) {
      console.error('Load folders error:', error)
    }
  }

  // UI Updates
  updateBookmarksDisplay() {
    const container = document.getElementById('bookmarks-container')
    
    if (this.bookmarks.length === 0) {
      container.innerHTML = `
        <div class="text-gray-500 text-center py-8">
          <i class="fas fa-bookmark text-4xl mb-4"></i>
          <p class="text-lg">ブックマークがありません</p>
          <p class="text-sm mt-2">「ブックマーク追加」ボタンから追加してください</p>
        </div>
      `
      return
    }

    const bookmarksHtml = this.bookmarks.map(bookmark => `
      <div class="bookmark-item border-b border-gray-100 p-4 hover:bg-gray-50" data-id="${bookmark.id}">
        <div class="flex items-center justify-between">
          <div class="flex items-start space-x-3 flex-1">
            <img src="${bookmark.favicon_url || 'https://via.placeholder.com/16'}" 
                 alt="favicon" class="w-4 h-4 mt-1 flex-shrink-0">
            <div class="flex-1 min-w-0">
              <div class="flex items-center space-x-2">
                <a href="${bookmark.url}" target="_blank" 
                   class="text-blue-600 hover:text-blue-800 font-medium truncate"
                   onclick="bookmarkManager.recordVisit(${bookmark.id})">
                  ${bookmark.title}
                </a>
                ${bookmark.is_favorite ? '<i class="fas fa-star text-yellow-500 text-sm"></i>' : ''}
              </div>
              <p class="text-sm text-gray-600 truncate mt-1">${bookmark.url}</p>
              ${bookmark.description ? `<p class="text-sm text-gray-500 mt-1">${bookmark.description}</p>` : ''}
              ${bookmark.tags && bookmark.tags.length > 0 ? `
                <div class="flex flex-wrap gap-1 mt-2">
                  ${bookmark.tags.map(tag => `<span class="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">${tag}</span>`).join('')}
                </div>
              ` : ''}
              <div class="text-xs text-gray-400 mt-2">
                <span>アクセス数: ${bookmark.visit_count}</span>
                ${bookmark.last_visited_at ? ` • 最終アクセス: ${new Date(bookmark.last_visited_at).toLocaleDateString('ja-JP')}` : ''}
              </div>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <button onclick="bookmarkManager.toggleFavorite(${bookmark.id}, ${!bookmark.is_favorite})" 
                    class="text-gray-400 hover:text-yellow-500" title="お気に入り">
              <i class="fas fa-star"></i>
            </button>
            <button onclick="bookmarkManager.editBookmark(${bookmark.id})" 
                    class="text-gray-400 hover:text-blue-500" title="編集">
              <i class="fas fa-edit"></i>
            </button>
            <button onclick="bookmarkManager.deleteBookmark(${bookmark.id})" 
                    class="text-gray-400 hover:text-red-500" title="削除">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('')

    container.innerHTML = bookmarksHtml
  }

  updateFoldersDisplay() {
    const container = document.getElementById('folder-tree')
    
    if (this.folders.length === 0) {
      container.innerHTML = `
        <div class="text-gray-500 text-center py-4">
          <i class="fas fa-folder-open text-3xl mb-2"></i>
          <p>フォルダなし</p>
        </div>
      `
      return
    }

    const renderFolder = (folder, level = 0) => {
      const indent = 'pl-' + (level * 4)
      let html = `
        <div class="folder-item ${indent} py-2 cursor-pointer hover:bg-gray-50 rounded" 
             onclick="bookmarkManager.selectFolder(${folder.id})">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <i class="fas fa-folder${folder.children && folder.children.length > 0 ? '-open' : ''} text-yellow-600"></i>
              <span class="text-sm font-medium">${folder.name}</span>
              <span class="text-xs text-gray-500">(${folder.bookmark_count || 0})</span>
            </div>
            <button onclick="event.stopPropagation(); bookmarkManager.deleteFolder(${folder.id})" 
                    class="text-gray-400 hover:text-red-500 text-xs">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `
      
      if (folder.children && folder.children.length > 0) {
        folder.children.forEach(child => {
          html += renderFolder(child, level + 1)
        })
      }
      
      return html
    }

    const allFoldersButton = `
      <div class="folder-item py-2 cursor-pointer hover:bg-gray-50 rounded mb-2 ${!this.currentFolder ? 'bg-blue-50 text-blue-600' : ''}" 
           onclick="bookmarkManager.selectFolder(null)">
        <div class="flex items-center space-x-2">
          <i class="fas fa-bookmark"></i>
          <span class="text-sm font-medium">すべてのブックマーク</span>
        </div>
      </div>
    `

    const foldersHtml = this.folders.map(folder => renderFolder(folder)).join('')
    container.innerHTML = allFoldersButton + foldersHtml
  }

  updateStatistics() {
    const totalBookmarks = this.bookmarks.length
    const totalFolders = this.folders.length
    const totalFavorites = this.bookmarks.filter(b => b.is_favorite).length

    document.getElementById('total-bookmarks').textContent = totalBookmarks
    document.getElementById('total-folders').textContent = totalFolders  
    document.getElementById('total-favorites').textContent = totalFavorites
    
    // Update last sync time
    const lastSyncElement = document.getElementById('last-sync')
    if (this.sessionToken) {
      lastSyncElement.textContent = new Date().toLocaleTimeString('ja-JP')
    }
  }

  // Folder operations
  selectFolder(folderId) {
    this.currentFolder = folderId
    this.loadBookmarks(folderId)
    
    // Update current folder display
    const folderName = folderId ? 
      this.findFolderById(folderId)?.name || 'フォルダ' : 
      'すべてのブックマーク'
    document.getElementById('current-folder').textContent = folderName
  }

  findFolderById(folderId) {
    const findInFolders = (folders) => {
      for (const folder of folders) {
        if (folder.id === folderId) return folder
        if (folder.children) {
          const found = findInFolders(folder.children)
          if (found) return found
        }
      }
      return null
    }
    return findInFolders(this.folders)
  }

  // Bookmark operations
  async recordVisit(bookmarkId) {
    try {
      await fetch(`/api/bookmarks/${bookmarkId}/visit`, {
        method: 'POST',
        headers: {
          'X-Session-Token': this.sessionToken
        }
      })
    } catch (error) {
      console.error('Record visit error:', error)
    }
  }

  async toggleFavorite(bookmarkId, isFavorite) {
    try {
      const response = await fetch(`/api/bookmarks/${bookmarkId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': this.sessionToken
        },
        body: JSON.stringify({ is_favorite: isFavorite })
      })

      const result = await response.json()
      
      if (result.success) {
        await this.loadBookmarks(this.currentFolder)
        this.showMessage(isFavorite ? 'お気に入りに追加しました' : 'お気に入りから削除しました', 'success')
      }
    } catch (error) {
      console.error('Toggle favorite error:', error)
      this.showMessage('お気に入りの更新に失敗しました', 'error')
    }
  }

  // Search and sort
  searchBookmarks(query) {
    this.loadBookmarks(this.currentFolder, query)
  }

  sortBookmarks(sortBy) {
    // Sort is handled by the API
    this.loadBookmarks(this.currentFolder, document.getElementById('search-input').value)
  }

  // Sync operations
  async syncData() {
    try {
      document.getElementById('sync-btn').disabled = true
      document.getElementById('sync-btn').innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>同期中...'
      
      const response = await fetch('/api/sync/trigger', {
        method: 'POST',
        headers: {
          'X-Session-Token': this.sessionToken
        }
      })

      const result = await response.json()
      
      if (result.success) {
        await this.loadData()
        this.showMessage('同期が完了しました', 'success')
      } else {
        this.showMessage('同期に失敗しました: ' + result.error, 'error')
      }
    } catch (error) {
      console.error('Sync error:', error)
      this.showMessage('同期エラーが発生しました', 'error')
    } finally {
      document.getElementById('sync-btn').disabled = false
      document.getElementById('sync-btn').innerHTML = '<i class="fas fa-sync mr-2"></i>同期実行'
    }
  }

  async exportBookmarks() {
    try {
      const format = confirm('HTML形式でエクスポートしますか？\\n（キャンセルでJSON形式）') ? 'html' : 'json'
      
      const response = await fetch(`/api/sync/export?format=${format}`, {
        headers: {
          'X-Session-Token': this.sessionToken
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `bookmarks.${format}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        
        this.showMessage('ブックマークをエクスポートしました', 'success')
      }
    } catch (error) {
      console.error('Export error:', error)
      this.showMessage('エクスポートに失敗しました', 'error')
    }
  }

  // Modal operations (simplified for MVP)
  showAddBookmarkModal() {
    const title = prompt('ブックマークのタイトル:')
    if (!title) return

    const url = prompt('URL:')
    if (!url) return

    const description = prompt('説明（オプション）:') || ''

    this.createBookmark({ title, url, description, folder_id: this.currentFolder })
  }

  showAddFolderModal() {
    const name = prompt('フォルダ名:')
    if (!name) return

    this.createFolder({ name, parent_id: null })
  }

  async createBookmark(data) {
    try {
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': this.sessionToken
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()
      
      if (result.success) {
        await this.loadBookmarks(this.currentFolder)
        this.updateStatistics()
        this.showMessage('ブックマークを追加しました', 'success')
      } else {
        this.showMessage('ブックマークの追加に失敗しました: ' + result.error, 'error')
      }
    } catch (error) {
      console.error('Create bookmark error:', error)
      this.showMessage('ブックマーク追加エラーが発生しました', 'error')
    }
  }

  async createFolder(data) {
    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': this.sessionToken
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()
      
      if (result.success) {
        await this.loadFolders()
        this.showMessage('フォルダを追加しました', 'success')
      } else {
        this.showMessage('フォルダの追加に失敗しました: ' + result.error, 'error')
      }
    } catch (error) {
      console.error('Create folder error:', error)
      this.showMessage('フォルダ追加エラーが発生しました', 'error')
    }
  }

  async deleteBookmark(bookmarkId) {
    if (!confirm('このブックマークを削除しますか？')) return

    try {
      const response = await fetch(`/api/bookmarks/${bookmarkId}`, {
        method: 'DELETE',
        headers: {
          'X-Session-Token': this.sessionToken
        }
      })

      const result = await response.json()
      
      if (result.success) {
        await this.loadBookmarks(this.currentFolder)
        this.updateStatistics()
        this.showMessage('ブックマークを削除しました', 'success')
      }
    } catch (error) {
      console.error('Delete bookmark error:', error)
      this.showMessage('ブックマーク削除エラーが発生しました', 'error')
    }
  }

  async deleteFolder(folderId) {
    if (!confirm('このフォルダを削除しますか？\\n（中身が空の場合のみ削除できます）')) return

    try {
      const response = await fetch(`/api/folders/${folderId}`, {
        method: 'DELETE',
        headers: {
          'X-Session-Token': this.sessionToken
        }
      })

      const result = await response.json()
      
      if (result.success) {
        await this.loadFolders()
        this.showMessage('フォルダを削除しました', 'success')
      } else {
        this.showMessage('フォルダの削除に失敗しました: ' + result.error, 'error')
      }
    } catch (error) {
      console.error('Delete folder error:', error)
      this.showMessage('フォルダ削除エラーが発生しました', 'error')
    }
  }

  // Utility methods
  showMessage(message, type = 'info') {
    // Simple alert for MVP - replace with toast notifications later
    const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'
    alert(emoji + ' ' + message)
  }
}

// Initialize the app
const bookmarkManager = new BookmarkManager()

// Make it globally available for onclick handlers
window.bookmarkManager = bookmarkManager