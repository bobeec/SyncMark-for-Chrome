import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { CloudflareBindings } from './types'
import { bookmarkRoutes } from './routes/bookmarks'
import { folderRoutes } from './routes/folders'
import { authRoutes } from './routes/auth'
import { syncRoutes } from './routes/sync'

const app = new Hono<{ Bindings: CloudflareBindings }>()

// Enable CORS for Chrome extension
app.use('/api/*', cors({
  origin: ['chrome-extension://*', 'http://localhost:*', 'https://*.pages.dev'],
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Session-Token']
}))

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// API routes
app.route('/api/auth', authRoutes)
app.route('/api/bookmarks', bookmarkRoutes)
app.route('/api/folders', folderRoutes)
app.route('/api/sync', syncRoutes)

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// Main page
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title data-i18n="app.name">SyncMark for Chrome</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/styles.css" rel="stylesheet">
        <!-- i18n System -->
        <script src="/static/i18n.js"></script>
    </head>
    <body class="bg-gray-50">
        <!-- Header -->
        <header class="bg-white shadow-sm border-b">
            <div class="max-w-7xl mx-auto px-4 py-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                        <i class="fas fa-bookmark text-blue-600 text-xl"></i>
                        <h1 class="text-xl font-bold text-gray-900" data-i18n="app.name">SyncMark for Chrome</h1>
                    </div>
                    <div class="flex items-center space-x-4">
                        <div id="auth-section" class="flex items-center space-x-2">
                            <button id="login-btn" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                                <i class="fab fa-google"></i>
                                <span data-i18n="auth.login">Sign in with Google</span>
                            </button>
                            <div id="user-info" class="hidden flex items-center space-x-2">
                                <img id="user-avatar" class="w-8 h-8 rounded-full" src="" alt="">
                                <span id="user-name" class="text-gray-700"></span>
                                <button id="logout-btn" class="text-gray-500 hover:text-gray-700">
                                    <i class="fas fa-sign-out-alt"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="max-w-7xl mx-auto px-4 py-6">
            <!-- Statistics Cards -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div class="bg-white p-4 rounded-lg shadow">
                    <div class="flex items-center">
                        <i class="fas fa-bookmark text-blue-600 text-xl mr-3"></i>
                        <div>
                            <p class="text-sm text-gray-600" data-i18n="stats.totalBookmarks">Total Bookmarks</p>
                            <p id="total-bookmarks" class="text-xl font-bold text-gray-900">0</p>
                        </div>
                    </div>
                </div>
                <div class="bg-white p-4 rounded-lg shadow">
                    <div class="flex items-center">
                        <i class="fas fa-folder text-yellow-600 text-xl mr-3"></i>
                        <div>
                            <p class="text-sm text-gray-600" data-i18n="stats.totalFolders">Total Folders</p>
                            <p id="total-folders" class="text-xl font-bold text-gray-900">0</p>
                        </div>
                    </div>
                </div>
                <div class="bg-white p-4 rounded-lg shadow">
                    <div class="flex items-center">
                        <i class="fas fa-star text-red-600 text-xl mr-3"></i>
                        <div>
                            <p class="text-sm text-gray-600" data-i18n="stats.totalFavorites">Favorites</p>
                            <p id="total-favorites" class="text-xl font-bold text-gray-900">0</p>
                        </div>
                    </div>
                </div>
                <div class="bg-white p-4 rounded-lg shadow">
                    <div class="flex items-center">
                        <i class="fas fa-sync text-green-600 text-xl mr-3"></i>
                        <div>
                            <p class="text-sm text-gray-600" data-i18n="stats.lastSync">Last Sync</p>
                            <p id="last-sync" class="text-sm font-medium text-gray-900" data-i18n="time.never">Never synced</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-wrap gap-4 mb-6">
                <button id="add-bookmark-btn" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                    <i class="fas fa-plus"></i>
                    <span data-i18n="bookmarks.addBookmark">Add Bookmark</span>
                </button>
                <button id="add-folder-btn" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2">
                    <i class="fas fa-folder-plus"></i>
                    <span data-i18n="folders.addFolder">Add Folder</span>
                </button>
                <button id="sync-btn" class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2">
                    <i class="fas fa-sync"></i>
                    <span data-i18n="actions.sync">Sync Now</span>
                </button>
                <button id="export-btn" class="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2">
                    <i class="fas fa-download"></i>
                    <span data-i18n="actions.export">Export</span>
                </button>
            </div>

            <!-- Main Content Area -->
            <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <!-- Sidebar - Folders -->
                <div class="lg:col-span-1">
                    <div class="bg-white rounded-lg shadow">
                        <div class="p-4 border-b">
                            <h2 class="font-semibold text-gray-900 flex items-center">
                                <i class="fas fa-folder-open mr-2"></i>
                                <span data-i18n="folders.title">Folders</span>
                            </h2>
                        </div>
                        <div id="folder-tree" class="p-4">
                            <div class="text-gray-500 text-center py-4">
                                <i class="fas fa-folder-open text-3xl mb-2"></i>
                                <p data-i18n="folders.noFolders">No folders</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Main Area - Bookmarks -->
                <div class="lg:col-span-3">
                    <div class="bg-white rounded-lg shadow">
                        <div class="p-4 border-b flex items-center justify-between">
                            <h2 class="font-semibold text-gray-900 flex items-center">
                                <i class="fas fa-bookmark mr-2"></i>
                                <span id="current-folder" data-i18n="bookmarks.allBookmarks">All Bookmarks</span>
                            </h2>
                            <div class="flex items-center space-x-2">
                                <input type="text" id="search-input" data-i18n="actions.search" placeholder="Search..." 
                                       class="px-3 py-1 border rounded-lg text-sm">
                                <select id="sort-select" class="px-3 py-1 border rounded-lg text-sm">
                                    <option value="title" data-i18n="sort.title">By Title</option>
                                    <option value="created_at" data-i18n="sort.created">By Created Date</option>
                                    <option value="last_visited_at" data-i18n="sort.visited">By Last Visited</option>
                                    <option value="visit_count" data-i18n="sort.popular">By Popularity</option>
                                </select>
                            </div>
                        </div>
                        <div id="bookmarks-container" class="p-4">
                            <div class="text-gray-500 text-center py-8">
                                <i class="fas fa-bookmark text-4xl mb-4"></i>
                                <p class="text-lg" data-i18n="bookmarks.noBookmarks">No bookmarks found</p>
                                <p class="text-sm mt-2" data-i18n="bookmarks.noBookmarksDesc">Click "Add Bookmark" to get started</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <!-- Chrome Extension Notice -->
        <div class="fixed bottom-4 right-4 z-50">
            <div id="extension-notice" class="bg-blue-600 text-white p-4 rounded-lg shadow-lg max-w-sm">
                <div class="flex items-start space-x-3">
                    <i class="fas fa-puzzle-piece text-xl mt-1"></i>
                    <div>
                        <h3 class="font-semibold" data-i18n="extension.title">Chrome Extension</h3>
                        <p class="text-sm mt-1" data-i18n="extension.description">Install the Chrome extension to enable automatic synchronization in your browser.</p>
                        <button id="install-extension-btn" class="mt-2 bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium">
                            <span data-i18n="extension.installExtension">Install Extension</span>
                        </button>
                    </div>
                    <button id="close-notice" class="text-white hover:text-gray-200">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        </div>

        <!-- Modal Containers -->
        <div id="modal-container"></div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app
