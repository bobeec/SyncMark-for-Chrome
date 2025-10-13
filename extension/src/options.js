/**
 * SyncMark for Chrome Extension - Options Page Script
 */

class SyncMarkOptions {
  constructor() {
    this.defaultSettings = {
      language: 'ja',
      autoSync: true,
      syncInterval: 5,
      floatingButton: true,
      autoDetection: true,
      notificationStyle: 'toast',
      apiUrl: 'http://localhost:3000/api'
    }
    
    this.currentSettings = { ...this.defaultSettings }
    
    this.init()
  }

  async init() {
    console.log('SyncMark Options: Initializing...')
    
    // Load current settings
    await this.loadSettings()
    
    // Setup event listeners
    this.setupEventListeners()
    
    // Update UI with current settings
    this.updateUI()
    
    console.log('SyncMark Options: Initialization complete')
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.local.get([
        'syncmark_settings',
        'syncmark_language'
      ])
      
      const savedSettings = result.syncmark_settings || {}
      const savedLanguage = result.syncmark_language
      
      this.currentSettings = {
        ...this.defaultSettings,
        ...savedSettings
      }
      
      // Override language if separately saved
      if (savedLanguage) {
        this.currentSettings.language = savedLanguage
      }
      
      console.log('Loaded settings:', this.currentSettings)
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  async saveSettings() {
    try {
      await chrome.storage.local.set({
        syncmark_settings: this.currentSettings,
        syncmark_language: this.currentSettings.language
      })
      
      // Notify background script of settings change
      chrome.runtime.sendMessage({
        action: 'settingsChanged',
        data: this.currentSettings
      })
      
      this.showStatus('Settings saved successfully!', 'success')
      console.log('Settings saved:', this.currentSettings)
    } catch (error) {
      console.error('Failed to save settings:', error)
      this.showStatus('Failed to save settings: ' + error.message, 'error')
    }
  }

  setupEventListeners() {
    // Language selector
    const languageSelect = document.getElementById('language-select')
    if (languageSelect) {
      languageSelect.addEventListener('change', (e) => {
        this.currentSettings.language = e.target.value
        // Apply language change immediately
        if (window.i18n) {
          window.i18n.changeLanguage(e.target.value)
        }
      })
    }

    // Auto sync toggle
    const autoSyncToggle = document.getElementById('auto-sync-toggle')
    if (autoSyncToggle) {
      autoSyncToggle.addEventListener('click', () => {
        this.currentSettings.autoSync = !this.currentSettings.autoSync
        this.updateToggle(autoSyncToggle, this.currentSettings.autoSync)
      })
    }

    // Sync interval selector
    const syncIntervalSelect = document.getElementById('sync-interval-select')
    if (syncIntervalSelect) {
      syncIntervalSelect.addEventListener('change', (e) => {
        this.currentSettings.syncInterval = parseInt(e.target.value)
      })
    }

    // Floating button toggle
    const floatingButtonToggle = document.getElementById('floating-button-toggle')
    if (floatingButtonToggle) {
      floatingButtonToggle.addEventListener('click', () => {
        this.currentSettings.floatingButton = !this.currentSettings.floatingButton
        this.updateToggle(floatingButtonToggle, this.currentSettings.floatingButton)
      })
    }

    // Auto detection toggle
    const autoDetectionToggle = document.getElementById('auto-detection-toggle')
    if (autoDetectionToggle) {
      autoDetectionToggle.addEventListener('click', () => {
        this.currentSettings.autoDetection = !this.currentSettings.autoDetection
        this.updateToggle(autoDetectionToggle, this.currentSettings.autoDetection)
      })
    }

    // Notification style selector
    const notificationStyleSelect = document.getElementById('notification-style-select')
    if (notificationStyleSelect) {
      notificationStyleSelect.addEventListener('change', (e) => {
        this.currentSettings.notificationStyle = e.target.value
      })
    }

    // API URL input
    const apiUrlInput = document.getElementById('api-url-input')
    if (apiUrlInput) {
      apiUrlInput.addEventListener('blur', (e) => {
        this.currentSettings.apiUrl = e.target.value.trim()
      })
    }

    // Test connection button
    const testConnectionBtn = document.getElementById('test-connection-btn')
    if (testConnectionBtn) {
      testConnectionBtn.addEventListener('click', () => this.testConnection())
    }

    // Export button
    const exportBtn = document.getElementById('export-btn')
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportData())
    }

    // Import button and file input
    const importBtn = document.getElementById('import-btn')
    const importFileInput = document.getElementById('import-file-input')
    
    if (importBtn && importFileInput) {
      importBtn.addEventListener('click', () => importFileInput.click())
      importFileInput.addEventListener('change', (e) => this.importData(e))
    }

    // Clear data button
    const clearDataBtn = document.getElementById('clear-data-btn')
    if (clearDataBtn) {
      clearDataBtn.addEventListener('click', () => this.clearData())
    }

    // Save button
    const saveBtn = document.getElementById('save-btn')
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveSettings())
    }

    // Reset button
    const resetBtn = document.getElementById('reset-btn')
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetSettings())
    }

    // Dashboard button
    const dashboardBtn = document.getElementById('dashboard-btn')
    if (dashboardBtn) {
      dashboardBtn.addEventListener('click', () => this.openDashboard())
    }
  }

  updateUI() {
    // Update language selector
    const languageSelect = document.getElementById('language-select')
    if (languageSelect) {
      languageSelect.value = this.currentSettings.language
    }

    // Update toggles
    const autoSyncToggle = document.getElementById('auto-sync-toggle')
    if (autoSyncToggle) {
      this.updateToggle(autoSyncToggle, this.currentSettings.autoSync)
    }

    const floatingButtonToggle = document.getElementById('floating-button-toggle')
    if (floatingButtonToggle) {
      this.updateToggle(floatingButtonToggle, this.currentSettings.floatingButton)
    }

    const autoDetectionToggle = document.getElementById('auto-detection-toggle')
    if (autoDetectionToggle) {
      this.updateToggle(autoDetectionToggle, this.currentSettings.autoDetection)
    }

    // Update selectors
    const syncIntervalSelect = document.getElementById('sync-interval-select')
    if (syncIntervalSelect) {
      syncIntervalSelect.value = this.currentSettings.syncInterval.toString()
    }

    const notificationStyleSelect = document.getElementById('notification-style-select')
    if (notificationStyleSelect) {
      notificationStyleSelect.value = this.currentSettings.notificationStyle
    }

    // Update API URL input
    const apiUrlInput = document.getElementById('api-url-input')
    if (apiUrlInput) {
      apiUrlInput.value = this.currentSettings.apiUrl
    }
  }

  updateToggle(toggleElement, isActive) {
    if (isActive) {
      toggleElement.classList.add('active')
    } else {
      toggleElement.classList.remove('active')
    }
  }

  async testConnection() {
    const testBtn = document.getElementById('test-connection-btn')
    if (testBtn) {
      testBtn.disabled = true
      testBtn.textContent = 'Testing...'
    }

    try {
      const response = await fetch(this.currentSettings.apiUrl + '/health')
      const result = await response.json()

      if (response.ok && result.status === 'OK') {
        this.showStatus('✅ Connection successful!', 'success')
      } else {
        throw new Error('Server responded with error')
      }
    } catch (error) {
      console.error('Connection test failed:', error)
      this.showStatus('❌ Connection failed: ' + error.message, 'error')
    } finally {
      if (testBtn) {
        testBtn.disabled = false
        testBtn.textContent = 'Test Connection'
      }
    }
  }

  async exportData() {
    try {
      // Get all stored data
      const allData = await chrome.storage.local.get(null)
      
      const exportData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        settings: this.currentSettings,
        data: allData
      }

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      })
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `syncmark-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      this.showStatus('Data exported successfully!', 'success')
    } catch (error) {
      console.error('Export failed:', error)
      this.showStatus('Export failed: ' + error.message, 'error')
    }
  }

  async importData(event) {
    const file = event.target.files[0]
    if (!file) return

    try {
      const text = await file.text()
      const importData = JSON.parse(text)

      // Validate import data
      if (!importData.version || !importData.settings) {
        throw new Error('Invalid import file format')
      }

      // Confirm import
      if (!confirm('This will overwrite your current settings. Continue?')) {
        return
      }

      // Import settings
      this.currentSettings = {
        ...this.defaultSettings,
        ...importData.settings
      }

      // Import data if available
      if (importData.data) {
        await chrome.storage.local.set(importData.data)
      }

      // Update UI
      this.updateUI()

      this.showStatus('Data imported successfully!', 'success')
    } catch (error) {
      console.error('Import failed:', error)
      this.showStatus('Import failed: ' + error.message, 'error')
    }

    // Reset file input
    event.target.value = ''
  }

  async clearData() {
    if (!confirm('This will remove all local data including login information. You will need to sign in again. Continue?')) {
      return
    }

    try {
      await chrome.storage.local.clear()
      
      // Reset settings to defaults
      this.currentSettings = { ...this.defaultSettings }
      this.updateUI()
      
      // Notify background script
      chrome.runtime.sendMessage({
        action: 'dataCleared'
      })

      this.showStatus('Local data cleared successfully!', 'success')
    } catch (error) {
      console.error('Clear data failed:', error)
      this.showStatus('Failed to clear data: ' + error.message, 'error')
    }
  }

  resetSettings() {
    if (!confirm('Reset all settings to defaults?')) {
      return
    }

    this.currentSettings = { ...this.defaultSettings }
    this.updateUI()
    this.showStatus('Settings reset to defaults', 'success')
  }

  openDashboard() {
    chrome.tabs.create({ url: 'http://localhost:3000' })
  }

  showStatus(message, type) {
    const statusDiv = document.getElementById('status-message')
    if (!statusDiv) return

    statusDiv.textContent = message
    statusDiv.className = `status-message status-${type}`
    statusDiv.style.display = 'block'

    // Auto hide after 5 seconds
    setTimeout(() => {
      statusDiv.style.display = 'none'
    }, 5000)
  }
}

// Initialize options page when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new SyncMarkOptions()
  })
} else {
  new SyncMarkOptions()
}