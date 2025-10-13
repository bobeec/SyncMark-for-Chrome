#!/usr/bin/env node

/**
 * SyncMark Chrome Extension Build Script
 * Prepares the extension for distribution
 */

const fs = require('fs')
const path = require('path')

const BUILD_DIR = path.join(__dirname, 'build')
const SRC_DIR = __dirname

// Files to copy to build directory
const FILES_TO_COPY = [
  'manifest.json',
  'popup.html',
  'popup.css',
  'options.html',
  'src/background.js',
  'src/content.js',
  'src/popup.js',
  'src/options.js',
  'src/i18n.js'
]

// Directories to copy
const DIRS_TO_COPY = [
  'icons'
]

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function copyFile(src, dest) {
  const destDir = path.dirname(dest)
  ensureDir(destDir)
  fs.copyFileSync(src, dest)
  console.log(`Copied: ${src} -> ${dest}`)
}

function copyDirectory(src, dest) {
  ensureDir(dest)
  
  const items = fs.readdirSync(src)
  
  items.forEach(item => {
    const srcPath = path.join(src, item)
    const destPath = path.join(dest, item)
    
    const stat = fs.statSync(srcPath)
    
    if (stat.isDirectory()) {
      copyDirectory(srcPath, destPath)
    } else {
      copyFile(srcPath, destPath)
    }
  })
}

function updateManifest() {
  const manifestPath = path.join(BUILD_DIR, 'manifest.json')
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  
  // Update for production
  manifest.host_permissions = [
    "https://*.pages.dev/*",
    "https://*.cloudflare.workers.dev/*"
  ]
  
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
  console.log('Updated manifest for production')
}

function build() {
  console.log('Building SyncMark Chrome Extension...')
  
  // Clean build directory
  if (fs.existsSync(BUILD_DIR)) {
    fs.rmSync(BUILD_DIR, { recursive: true })
  }
  ensureDir(BUILD_DIR)
  
  // Copy files
  FILES_TO_COPY.forEach(file => {
    const src = path.join(SRC_DIR, file)
    const dest = path.join(BUILD_DIR, file)
    
    if (fs.existsSync(src)) {
      copyFile(src, dest)
    } else {
      console.warn(`Warning: ${src} not found, skipping...`)
    }
  })
  
  // Copy directories
  DIRS_TO_COPY.forEach(dir => {
    const src = path.join(SRC_DIR, dir)
    const dest = path.join(BUILD_DIR, dir)
    
    if (fs.existsSync(src)) {
      copyDirectory(src, dest)
    } else {
      console.warn(`Warning: ${src} directory not found, skipping...`)
    }
  })
  
  // Update manifest for production
  updateManifest()
  
  // Create src directory in build
  const buildSrcDir = path.join(BUILD_DIR, 'src')
  ensureDir(buildSrcDir)
  
  console.log('\n✅ Extension build complete!')
  console.log(`📦 Build output: ${BUILD_DIR}`)
  console.log('\n📋 Next steps:')
  console.log('1. Load the extension in Chrome:')
  console.log('   - Open chrome://extensions/')
  console.log('   - Enable Developer mode')
  console.log('   - Click "Load unpacked"')
  console.log(`   - Select the ${BUILD_DIR} folder`)
  console.log('\n2. Test the extension functionality')
  console.log('3. For Chrome Web Store distribution, create a ZIP file of the build folder')
}

// Run build if called directly
if (require.main === module) {
  build()
}

module.exports = { build }