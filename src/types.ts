// Database bindings
export interface CloudflareBindings {
  // D1 binding (use any here to avoid depending on external types in this repo)
  DB: any;
  // Google OAuth client ID (set as environment variable / Wrangler secret)
  GOOGLE_CLIENT_ID?: string;
}

// User models
export interface User {
  id: number;
  google_id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

// Folder models
export interface Folder {
  id: number;
  user_id: number;
  name: string;
  parent_id?: number;
  position: number;
  created_at: string;
  updated_at: string;
  children?: Folder[];
}

// Bookmark models
export interface Bookmark {
  id: number;
  user_id: number;
  folder_id?: number;
  title: string;
  url: string;
  description?: string;
  favicon_url?: string;
  position: number;
  tags?: string[];
  is_favorite: boolean;
  visit_count: number;
  last_visited_at?: string;
  created_at: string;
  updated_at: string;
}

// Sync session models
export interface SyncSession {
  id: number;
  user_id: number;
  session_token: string;
  device_info?: object;
  last_sync_at: string;
  expires_at: string;
  created_at: string;
}

// API Request/Response types
export interface CreateBookmarkRequest {
  title: string;
  url: string;
  description?: string;
  folder_id?: number;
  tags?: string[];
  is_favorite?: boolean;
}

export interface UpdateBookmarkRequest extends Partial<CreateBookmarkRequest> {
  position?: number;
  visit_count?: number;
}

export interface CreateFolderRequest {
  name: string;
  parent_id?: number;
  position?: number;
}

export interface BookmarkSyncData {
  bookmarks: Bookmark[];
  folders: Folder[];
  deleted_bookmark_ids: number[];
  deleted_folder_ids: number[];
  timestamp: string;
}

// Chrome extension message types
export interface ExtensionMessage {
  action: 'sync' | 'add_bookmark' | 'remove_bookmark' | 'get_bookmarks';
  data?: any;
}

export interface ExtensionResponse {
  success: boolean;
  data?: any;
  error?: string;
}