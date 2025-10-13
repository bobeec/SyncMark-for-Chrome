-- Users table for Google account management
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  google_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bookmark folders/categories
CREATE TABLE IF NOT EXISTS folders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  parent_id INTEGER, -- For nested folders
  position INTEGER DEFAULT 0, -- For ordering
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
);

-- Bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  folder_id INTEGER,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  favicon_url TEXT,
  position INTEGER DEFAULT 0, -- For ordering within folder
  tags TEXT, -- JSON array of tags
  is_favorite BOOLEAN DEFAULT 0,
  visit_count INTEGER DEFAULT 0,
  last_visited_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
);

-- Sync sessions for tracking Chrome extension sync
CREATE TABLE IF NOT EXISTS sync_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  device_info TEXT, -- JSON with browser info
  last_sync_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_folder_id ON bookmarks(folder_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_url ON bookmarks(url);
CREATE INDEX IF NOT EXISTS idx_bookmarks_favorite ON bookmarks(is_favorite);
CREATE INDEX IF NOT EXISTS idx_sync_sessions_user_id ON sync_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_sessions_token ON sync_sessions(session_token);