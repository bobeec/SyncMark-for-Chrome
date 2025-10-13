-- Insert test user
INSERT OR IGNORE INTO users (google_id, email, name, avatar_url) VALUES 
  ('test-google-id-123', 'test@example.com', 'Test User', 'https://via.placeholder.com/40');

-- Insert test folders
INSERT OR IGNORE INTO folders (user_id, name, position) VALUES 
  (1, '開発関連', 1),
  (1, 'ニュース', 2),
  (1, 'ショッピング', 3),
  (1, 'エンターテイメント', 4);

-- Insert nested folder
INSERT OR IGNORE INTO folders (user_id, name, parent_id, position) VALUES 
  (1, 'JavaScript', 1, 1),
  (1, 'Python', 1, 2);

-- Insert test bookmarks
INSERT OR IGNORE INTO bookmarks (user_id, folder_id, title, url, description, position, is_favorite) VALUES 
  (1, 1, 'GitHub', 'https://github.com', 'ソースコード管理', 1, 1),
  (1, 1, 'Stack Overflow', 'https://stackoverflow.com', 'プログラミングQ&A', 2, 1),
  (1, 5, 'MDN Web Docs', 'https://developer.mozilla.org', 'JavaScript リファレンス', 1, 0),
  (1, 6, 'Python.org', 'https://python.org', 'Python 公式サイト', 1, 0),
  (1, 2, 'TechCrunch', 'https://techcrunch.com', 'テック系ニュース', 1, 0),
  (1, 3, 'Amazon', 'https://amazon.co.jp', 'オンラインショッピング', 1, 0),
  (1, 4, 'YouTube', 'https://youtube.com', '動画配信サービス', 1, 1);

-- Update last_visited_at for some bookmarks
UPDATE bookmarks SET last_visited_at = CURRENT_TIMESTAMP, visit_count = 5 WHERE id IN (1, 2);
UPDATE bookmarks SET last_visited_at = datetime('now', '-1 day'), visit_count = 3 WHERE id IN (3, 7);
UPDATE bookmarks SET last_visited_at = datetime('now', '-2 days'), visit_count = 1 WHERE id IN (4, 5, 6);