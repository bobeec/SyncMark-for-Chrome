/**
 * SyncMark for Chrome Extension - Content Script
 * Runs on all web pages to provide bookmark functionality
 */

class SyncMarkContent {
  constructor() {
    this.isInitialized = false
    this.config = {
      API_BASE_URL: 'http://localhost:3000/api',
      FLOATING_BUTTON_ENABLED: true,
      AUTO_DETECTION_ENABLED: true
    }
    
    this.init()
  }

  async init() {
    if (this.isInitialized) return
    
    console.log('SyncMark Content: Initializing on', window.location.hostname)
    
    // Don't run on extension pages
    if (window.location.protocol === 'chrome-extension:') return
    
    // Load settings from storage
    await this.loadSettings()
    
    // Create floating bookmark button if enabled
    if (this.config.FLOATING_BUTTON_ENABLED) {
      this.createFloatingButton()
    }
    
    // Set up keyboard shortcuts
    this.setupKeyboardShortcuts()
    
    // Set up message listener
    this.setupMessageListener()
    
    // Auto-detect bookmarkable content if enabled
    if (this.config.AUTO_DETECTION_ENABLED) {
      this.detectBookmarkableContent()
    }
    
    this.isInitialized = true
    console.log('SyncMark Content: Initialization complete')
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.local.get(['syncmark_settings'])
      const settings = result.syncmark_settings || {}
      
      this.config = {
        ...this.config,
        ...settings
      }
    } catch (error) {
      console.error('SyncMark Content: Failed to load settings:', error)
    }
  }

  createFloatingButton() {
    // Check if button already exists
    if (document.getElementById('syncmark-floating-btn')) return
    
    const button = document.createElement('div')
    button.id = 'syncmark-floating-btn'
    button.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
      </svg>
    `
    
    // Apply styles
    button.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      border: none;
      border-radius: 24px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
      z-index: 9999;
      transition: all 0.2s ease;
      color: white;
      opacity: 0.9;
    `
    
    // Add hover effects
    button.addEventListener('mouseenter', () => {
      button.style.opacity = '1'
      button.style.transform = 'scale(1.1)'
    })
    
    button.addEventListener('mouseleave', () => {
      button.style.opacity = '0.9'
      button.style.transform = 'scale(1)'
    })
    
    // Add click handler
    button.addEventListener('click', () => {
      this.handleQuickBookmark()
    })
    
    // Add to page
    document.body.appendChild(button)
    
    // Auto-hide after 5 seconds, show on page scroll/hover
    let hideTimer = setTimeout(() => {
      button.style.opacity = '0.3'
    }, 5000)
    
    // Show on scroll or mouse movement
    const showButton = () => {
      button.style.opacity = '0.9'
      clearTimeout(hideTimer)
      hideTimer = setTimeout(() => {
        button.style.opacity = '0.3'
      }, 5000)
    }
    
    window.addEventListener('scroll', showButton)
    document.addEventListener('mousemove', showButton)
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
      // Ctrl/Cmd + Shift + B - Quick bookmark
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'B') {
        event.preventDefault()
        this.handleQuickBookmark()
      }
      
      // Ctrl/Cmd + Shift + S - Open SyncMark dashboard
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'S') {
        event.preventDefault()
        this.openDashboard()
      }
    })
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.action) {
        case 'addCurrentPage':
          this.handleQuickBookmark()
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ success: false, error: error.message }))
          return true // Keep message channel open

        case 'getPageInfo':
          sendResponse({
            success: true,
            pageInfo: this.getPageInfo()
          })
          break

        case 'detectContent':
          sendResponse({
            success: true,
            content: this.detectBookmarkableContent()
          })
          break

        default:
          console.warn('SyncMark Content: Unknown message action:', request.action)
      }
    })
  }

  getPageInfo() {
    // Extract page metadata
    const getMetaContent = (name) => {
      const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`)
      return meta ? meta.getAttribute('content') : null
    }
    
    const title = document.title || 'Untitled Page'
    const url = window.location.href
    const description = getMetaContent('description') || 
                       getMetaContent('og:description') || 
                       this.extractTextSummary()
    
    const favicon = this.getFaviconUrl()
    const image = getMetaContent('og:image') || this.getMainImage()
    
    // Extract tags from keywords and page content
    const tags = this.extractTags()
    
    return {
      title,
      url,
      description,
      favicon,
      image,
      tags,
      domain: window.location.hostname,
      timestamp: new Date().toISOString()
    }
  }

  getFaviconUrl() {
    const favicon = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]')
    if (favicon && favicon.href) {
      return favicon.href
    }
    return `${window.location.protocol}//${window.location.hostname}/favicon.ico`
  }

  getMainImage() {
    // Try to find the main image on the page
    const images = document.querySelectorAll('img')
    let mainImage = null
    let maxArea = 0
    
    images.forEach(img => {
      if (img.width && img.height) {
        const area = img.width * img.height
        if (area > maxArea && area > 10000) { // At least 100x100px
          mainImage = img.src
          maxArea = area
        }
      }
    })
    
    return mainImage
  }

  extractTextSummary() {
    // Extract first paragraph or meaningful text
    const paragraphs = document.querySelectorAll('p, .content p, article p, main p')
    
    for (const p of paragraphs) {
      const text = p.textContent.trim()
      if (text.length > 50 && text.length < 300) {
        return text
      }
    }
    
    // Fallback to any text content
    const textContent = document.body.textContent.trim()
    if (textContent.length > 50) {
      return textContent.substring(0, 200) + '...'
    }
    
    return ''
  }

  extractTags() {
    const tags = new Set()
    
    // From meta keywords
    const keywords = document.querySelector('meta[name="keywords"]')
    if (keywords) {
      keywords.getAttribute('content').split(',').forEach(tag => {
        const cleaned = tag.trim().toLowerCase()
        if (cleaned.length > 1) tags.add(cleaned)
      })
    }
    
    // From page headings
    const headings = document.querySelectorAll('h1, h2, h3')
    headings.forEach(h => {
      const words = h.textContent.toLowerCase().split(/\s+/)
      words.forEach(word => {
        if (word.length > 3 && word.length < 20) {
          tags.add(word)
        }
      })
    })
    
    // From domain
    const domain = window.location.hostname.replace('www.', '')
    tags.add(domain)
    
    return Array.from(tags).slice(0, 10) // Limit to 10 tags
  }

  detectBookmarkableContent() {
    const content = {
      articles: [],
      videos: [],
      images: [],
      links: []
    }
    
    // Detect articles
    const articles = document.querySelectorAll('article, .post, .content, main')
    articles.forEach(article => {
      const title = article.querySelector('h1, h2, .title')?.textContent?.trim()
      if (title && title.length > 10) {
        content.articles.push({
          title,
          element: article.tagName.toLowerCase(),
          excerpt: this.extractTextSummary()
        })
      }
    })
    
    // Detect videos
    const videos = document.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"]')
    videos.forEach(video => {
      let title = ''
      if (video.tagName === 'IFRAME') {
        title = video.getAttribute('title') || 'Video'
      } else {
        title = video.getAttribute('alt') || video.getAttribute('title') || 'Video'
      }
      
      content.videos.push({
        title,
        src: video.src || video.getAttribute('data-src'),
        type: video.tagName.toLowerCase()
      })
    })
    
    // Detect important links
    const links = document.querySelectorAll('a[href^="http"]')
    const importantLinks = Array.from(links)
      .filter(link => {
        const text = link.textContent.trim()
        return text.length > 5 && text.length < 100
      })
      .slice(0, 10) // Limit to 10 links
    
    importantLinks.forEach(link => {
      content.links.push({
        title: link.textContent.trim(),
        url: link.href,
        domain: new URL(link.href).hostname
      })
    })
    
    return content
  }

  async handleQuickBookmark() {
    try {
      // Show loading indicator
      this.showNotification('Adding bookmark...', 'info')
      
      const pageInfo = this.getPageInfo()
      
      // Send message to background script to add bookmark
      const response = await this.sendMessageToBackground('addBookmark', pageInfo)
      
      if (response.success) {
        this.showNotification('Bookmark added successfully!', 'success')
      } else {
        throw new Error(response.error || 'Failed to add bookmark')
      }
    } catch (error) {
      console.error('SyncMark Content: Quick bookmark failed:', error)
      this.showNotification('Failed to add bookmark: ' + error.message, 'error')
    }
  }

  openDashboard() {
    window.open('http://localhost:3000', '_blank')
  }

  async sendMessageToBackground(action, data) {
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

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div')
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      font-weight: 500;
      z-index: 10000;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      backdrop-filter: blur(10px);
      animation: slideInRight 0.3s ease;
      ${type === 'success' ? 'background: rgba(16, 185, 129, 0.95); color: white;' : ''}
      ${type === 'error' ? 'background: rgba(239, 68, 68, 0.95); color: white;' : ''}
      ${type === 'info' ? 'background: rgba(59, 130, 246, 0.95); color: white;' : ''}
    `
    
    // Add slide animation
    const style = document.createElement('style')
    style.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `
    document.head.appendChild(style)
    
    notification.textContent = message
    document.body.appendChild(notification)
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease'
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification)
        }
        if (style.parentNode) {
          style.parentNode.removeChild(style)
        }
      }, 300)
    }, 3000)
  }
}

// Initialize content script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new SyncMarkContent()
  })
} else {
  new SyncMarkContent()
}