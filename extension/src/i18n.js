/**
 * SyncMark for Chrome Extension - i18n System
 * Lightweight internationalization for Chrome extension
 */

const i18n = {
  currentLanguage: 'ja',
  fallbackLanguage: 'en',
  
  translations: {
    ja: {
      "app.name": "SyncMark for Chrome",
      "auth.login": "Googleでログイン",
      "auth.logout": "ログアウト",
      "nav.dashboard": "ダッシュボード",
      "stats.totalBookmarks": "ブックマーク",
      "stats.totalFolders": "フォルダ",
      "stats.totalFavorites": "お気に入り",
      "actions.sync": "同期実行",
      "bookmarks.addBookmark": "ブックマーク追加",
      "bookmarks.currentPage": "現在のページ",
      "bookmarks.recent": "最近",
      "settings.title": "設定",
      "extension.description": "ブラウザでの自動同期を有効にするには、Chrome拡張機能をインストールしてください。",
      "extension.openWeb": "Webアプリ",
      "messages.loading": "読み込み中...",
      "time.never": "未同期",
      "time.justNow": "たった今",
      "time.minutesAgo": "分前",
      "time.hoursAgo": "時間前",
      "time.daysAgo": "日前"
    },
    en: {
      "app.name": "SyncMark for Chrome",
      "auth.login": "Sign in with Google",
      "auth.logout": "Sign out",
      "nav.dashboard": "Dashboard",
      "stats.totalBookmarks": "Bookmarks",
      "stats.totalFolders": "Folders",
      "stats.totalFavorites": "Favorites",
      "actions.sync": "Sync Now",
      "bookmarks.addBookmark": "Add Bookmark",
      "bookmarks.currentPage": "Current Page",
      "bookmarks.recent": "Recent",
      "settings.title": "Settings",
      "extension.description": "Install the Chrome extension to enable automatic synchronization in your browser.",
      "extension.openWeb": "Web App",
      "messages.loading": "Loading...",
      "time.never": "Never synced",
      "time.justNow": "Just now",
      "time.minutesAgo": "minutes ago",
      "time.hoursAgo": "hours ago",
      "time.daysAgo": "days ago"
    }
  },

  // Initialize i18n system
  init() {
    // Load saved language or detect browser language
    chrome.storage.local.get(['syncmark_language'], (result) => {
      const savedLang = result.syncmark_language
      const browserLang = chrome.i18n.getUILanguage()
      
      let targetLang = savedLang || (browserLang.startsWith('ja') ? 'ja' : 'en')
      this.changeLanguage(targetLang)
    })

    this.setupLanguageSwitcher()
  },

  // Get translation for a key
  t(key, params = {}) {
    let translation = this.translations[this.currentLanguage]?.[key] ||
                     this.translations[this.fallbackLanguage]?.[key] ||
                     key

    // Replace parameters
    if (typeof translation === 'string' && Object.keys(params).length > 0) {
      translation = translation.replace(/\{\{(\w+)\}\}/g, (match, param) => {
        return params[param] !== undefined ? params[param] : match
      })
    }

    return translation
  },

  // Change current language
  changeLanguage(langCode) {
    this.currentLanguage = langCode
    
    // Save preference
    chrome.storage.local.set({ syncmark_language: langCode })
    
    // Update page content
    this.updatePageContent()
    
    // Update language button
    this.updateLanguageButton()
  },

  // Update all elements with data-i18n attributes
  updatePageContent() {
    const elements = document.querySelectorAll('[data-i18n]')
    elements.forEach(element => {
      const key = element.getAttribute('data-i18n')
      const translation = this.t(key)
      
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        element.placeholder = translation
      } else {
        element.textContent = translation
      }
    })
  },

  // Setup language switcher
  setupLanguageSwitcher() {
    const langBtn = document.getElementById('lang-btn')
    const langDropdown = document.getElementById('lang-dropdown')
    const langOptions = document.querySelectorAll('.lang-option')

    if (!langBtn || !langDropdown) return

    // Toggle dropdown
    langBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      langDropdown.classList.toggle('hidden')
    })

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      langDropdown.classList.add('hidden')
    })

    // Language selection
    langOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        e.stopPropagation()
        const langCode = option.getAttribute('data-lang')
        this.changeLanguage(langCode)
        langDropdown.classList.add('hidden')
      })
    })
  },

  // Update language button display
  updateLanguageButton() {
    const flag = document.querySelector('.lang-button .flag')
    if (flag) {
      flag.textContent = this.currentLanguage === 'ja' ? '🇯🇵' : '🇺🇸'
    }
  },

  // Format time relative to now
  formatTimeAgo(date) {
    if (!date) return this.t('time.never')
    
    const now = new Date()
    const past = new Date(date)
    const diffMs = now.getTime() - past.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return this.t('time.justNow')
    if (diffMins < 60) return `${diffMins} ${this.t('time.minutesAgo')}`
    if (diffHours < 24) return `${diffHours} ${this.t('time.hoursAgo')}`
    return `${diffDays} ${this.t('time.daysAgo')}`
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => i18n.init())
} else {
  i18n.init()
}

// Export for use in other scripts
window.i18n = i18n