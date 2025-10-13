/**
 * SyncMark for Chrome - Internationalization (i18n) System
 * Lightweight JavaScript i18n implementation
 */

class I18n {
  constructor() {
    this.currentLanguage = 'ja' // Default to Japanese
    this.languages = {
      ja: { name: '日本語', flag: '🇯🇵' },
      en: { name: 'English', flag: '🇺🇸' }
    }
    this.translations = {}
    this.fallbackLanguage = 'en'
    this.loadedLanguages = new Set()
  }

  /**
   * Initialize i18n system
   */
  async init() {
    // Detect browser language
    const browserLanguage = this.detectBrowserLanguage()
    
    // Load saved language preference or use browser language
    const savedLanguage = localStorage.getItem('syncmark_language')
    const targetLanguage = savedLanguage || browserLanguage
    
    // Load default language first, then target language
    if (targetLanguage !== this.fallbackLanguage) {
      await this.loadLanguage(this.fallbackLanguage)
    }
    
    await this.changeLanguage(targetLanguage)
    
    // Set up language switcher
    this.setupLanguageSwitcher()
  }

  /**
   * Detect browser's preferred language
   */
  detectBrowserLanguage() {
    const browserLang = navigator.language || navigator.userLanguage
    
    // Map browser language codes to supported languages
    if (browserLang.startsWith('ja')) return 'ja'
    if (browserLang.startsWith('en')) return 'en'
    
    return 'ja' // Default to Japanese for Japanese users
  }

  /**
   * Load language file
   */
  async loadLanguage(langCode) {
    if (this.loadedLanguages.has(langCode)) {
      return this.translations[langCode]
    }

    try {
      const response = await fetch(`/static/i18n/${langCode}.json`)
      if (!response.ok) {
        throw new Error(`Failed to load language file: ${langCode}`)
      }
      
      const translations = await response.json()
      this.translations[langCode] = translations
      this.loadedLanguages.add(langCode)
      
      return translations
    } catch (error) {
      console.error(`Error loading language file ${langCode}:`, error)
      
      // If loading fails and it's not the fallback, try fallback
      if (langCode !== this.fallbackLanguage) {
        return await this.loadLanguage(this.fallbackLanguage)
      }
      
      return {}
    }
  }

  /**
   * Change current language
   */
  async changeLanguage(langCode) {
    if (!this.languages[langCode]) {
      console.warn(`Language ${langCode} not supported`)
      langCode = this.fallbackLanguage
    }

    await this.loadLanguage(langCode)
    this.currentLanguage = langCode
    
    // Save preference
    localStorage.setItem('syncmark_language', langCode)
    
    // Update page content
    this.updatePageContent()
    
    // Dispatch language change event
    window.dispatchEvent(new CustomEvent('languageChanged', { 
      detail: { language: langCode } 
    }))
  }

  /**
   * Get translation for a key
   */
  t(key, params = {}) {
    const keys = key.split('.')
    let translation = this.translations[this.currentLanguage]
    
    // Navigate through nested object
    for (const k of keys) {
      if (translation && typeof translation === 'object') {
        translation = translation[k]
      } else {
        translation = undefined
        break
      }
    }

    // Fallback to default language if not found
    if (translation === undefined && this.currentLanguage !== this.fallbackLanguage) {
      let fallbackTranslation = this.translations[this.fallbackLanguage]
      for (const k of keys) {
        if (fallbackTranslation && typeof fallbackTranslation === 'object') {
          fallbackTranslation = fallbackTranslation[k]
        } else {
          fallbackTranslation = undefined
          break
        }
      }
      translation = fallbackTranslation
    }

    // If still not found, return the key
    if (translation === undefined) {
      console.warn(`Translation not found for key: ${key}`)
      return key
    }

    // Replace parameters
    if (typeof translation === 'string' && Object.keys(params).length > 0) {
      return translation.replace(/\{\{(\w+)\}\}/g, (match, param) => {
        return params[param] !== undefined ? params[param] : match
      })
    }

    return translation
  }

  /**
   * Update all page content with translations
   */
  updatePageContent() {
    // Update elements with data-i18n attribute
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

    // Update elements with data-i18n-html attribute (for HTML content)
    const htmlElements = document.querySelectorAll('[data-i18n-html]')
    htmlElements.forEach(element => {
      const key = element.getAttribute('data-i18n-html')
      const translation = this.t(key)
      element.innerHTML = translation
    })

    // Update document title
    document.title = this.t('app.name')

    // Update language direction if needed
    document.documentElement.dir = this.isRTL(this.currentLanguage) ? 'rtl' : 'ltr'
    document.documentElement.lang = this.currentLanguage
  }

  /**
   * Setup language switcher in UI
   */
  setupLanguageSwitcher() {
    // Find or create language switcher
    let switcher = document.getElementById('language-switcher')
    
    if (!switcher) {
      // Create language switcher element
      switcher = document.createElement('div')
      switcher.id = 'language-switcher'
      switcher.className = 'language-switcher'
      
      // Find appropriate location (header area)
      const authSection = document.getElementById('auth-section')
      if (authSection) {
        authSection.appendChild(switcher)
      }
    }

    // Build switcher HTML
    const switcherHTML = `
      <div class="relative inline-block">
        <button id="language-button" class="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded">
          <span class="flag">${this.languages[this.currentLanguage].flag}</span>
          <span class="name">${this.languages[this.currentLanguage].name}</span>
          <i class="fas fa-chevron-down text-xs"></i>
        </button>
        <div id="language-dropdown" class="absolute right-0 mt-1 w-32 bg-white border border-gray-300 rounded-lg shadow-lg hidden z-50">
          ${Object.entries(this.languages).map(([code, lang]) => `
            <button data-lang="${code}" class="language-option w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2">
              <span class="flag">${lang.flag}</span>
              <span class="name">${lang.name}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `
    
    switcher.innerHTML = switcherHTML

    // Setup event listeners
    const button = document.getElementById('language-button')
    const dropdown = document.getElementById('language-dropdown')
    const options = document.querySelectorAll('.language-option')

    button.addEventListener('click', (e) => {
      e.stopPropagation()
      dropdown.classList.toggle('hidden')
    })

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      dropdown.classList.add('hidden')
    })

    // Language selection
    options.forEach(option => {
      option.addEventListener('click', async (e) => {
        e.stopPropagation()
        const langCode = option.getAttribute('data-lang')
        await this.changeLanguage(langCode)
        dropdown.classList.add('hidden')
        
        // Update button text
        const flag = button.querySelector('.flag')
        const name = button.querySelector('.name')
        flag.textContent = this.languages[langCode].flag
        name.textContent = this.languages[langCode].name
      })
    })
  }

  /**
   * Check if language is right-to-left
   */
  isRTL(langCode) {
    const rtlLanguages = ['ar', 'he', 'fa', 'ur']
    return rtlLanguages.includes(langCode)
  }

  /**
   * Format time relative to now
   */
  formatTimeAgo(date) {
    if (!date) return this.t('time.never')
    
    const now = new Date()
    const past = new Date(date)
    const diffMs = now.getTime() - past.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffWeeks = Math.floor(diffDays / 7)
    const diffMonths = Math.floor(diffDays / 30)
    const diffYears = Math.floor(diffDays / 365)

    if (diffMins < 1) return this.t('time.justNow')
    if (diffMins < 60) return `${diffMins} ${this.t('time.minutesAgo')}`
    if (diffHours < 24) return `${diffHours} ${this.t('time.hoursAgo')}`
    if (diffDays < 7) return `${diffDays} ${this.t('time.daysAgo')}`
    if (diffWeeks < 4) return `${diffWeeks} ${this.t('time.weeksAgo')}`
    if (diffMonths < 12) return `${diffMonths} ${this.t('time.monthsAgo')}`
    return `${diffYears} ${this.t('time.yearsAgo')}`
  }

  /**
   * Get current language code
   */
  getCurrentLanguage() {
    return this.currentLanguage
  }

  /**
   * Get available languages
   */
  getAvailableLanguages() {
    return this.languages
  }
}

// Global instance
window.i18n = new I18n()

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.i18n.init()
  })
} else {
  window.i18n.init()
}