# SyncMark for Chrome

**Chrome系ブラウザ対応ブックマーク同期サービス**  
*Bookmark Synchronization Service for Chrome-based Browsers*

## 📖 プロジェクト概要 / Project Overview

### 🎯 目標 / Goals
- **日本語**: Chrome系ブラウザ間でブックマークを同期できるWebアプリ+Chrome拡張機能
- **English**: Web application and Chrome extension for synchronizing bookmarks across Chrome-based browsers

### ⭐ 主な機能 / Main Features
- 🌐 **多言語対応** (日本語・英語) / Multilingual support (Japanese/English)  
- 🔄 **リアルタイム同期** / Real-time synchronization
- 📂 **フォルダ管理** / Folder management
- ⭐ **お気に入り機能** / Favorites system
- 🔍 **検索・並び替え** / Search and sorting
- 🛡️ **Googleログイン認証** / Google OAuth authentication
- 📱 **レスポンシブUI** / Responsive interface

## 🌐 公開URL / Public URLs

### 開発環境 / Development Environment
- **Webアプリ**: https://3000-iieuh916jtoaqqegoxuy4-c81df28e.sandbox.novita.ai
- **API Health Check**: https://3000-iieuh916jtoaqqegoxuy4-c81df28e.sandbox.novita.ai/api/health
- **GitHub**: *予定 / To be configured*

### 本番環境 / Production Environment
- **Cloudflare Pages**: *デプロイ予定 / To be deployed*
- **Chrome Web Store**: *公開予定 / To be published*

## 🏗️ データアーキテクチャ / Data Architecture

### データモデル / Data Models
- **ユーザー管理** / User management: Google OAuth認証
- **ブックマーク** / Bookmarks: タイトル、URL、説明、タグ、お気に入り
- **フォルダ** / Folders: 階層構造対応、位置管理
- **同期セッション** / Sync sessions: デバイス間同期管理

### ストレージサービス / Storage Services
- **Cloudflare D1**: SQLite分散データベース
- **Chrome Extension Storage**: ローカルキャッシュ
- **LocalStorage**: ユーザー設定

### データフロー / Data Flow
1. **Chrome拡張** → **Webアプリ** (ブックマーク追加・変更)
2. **Webアプリ** → **D1データベース** (永続化)
3. **バックグラウンド同期** → **他デバイス** (リアルタイム反映)

## 👥 利用方法 / User Guide

### 基本的な使い方 / Basic Usage

#### 1. ログイン / Sign In
1. Webアプリにアクセス
2. 「Googleでログイン」ボタンをクリック（現在はモック認証）
3. 認証完了後、ダッシュボードが表示されます

#### 2. ブックマーク管理 / Bookmark Management
- **追加**: 「ブックマーク追加」ボタンまたはChrome拡張の浮遊ボタン
- **編集**: ブックマーク項目の編集ボタン
- **削除**: ブックマーク項目の削除ボタン
- **検索**: 上部検索バーでタイトル・URL・説明を検索
- **並び替え**: タイトル順、作成日順、アクセス順、人気順

#### 3. フォルダ管理 / Folder Management
- **作成**: 「フォルダ追加」ボタン
- **階層**: ネストしたフォルダ構造に対応
- **移動**: ドラッグ&ドロップで整理

#### 4. Chrome拡張機能 / Chrome Extension
- **インストール**: `extension/`フォルダをChromeに読み込み
- **浮遊ボタン**: ページ上の青いブックマークボタン
- **ポップアップ**: 拡張アイコンクリックでクイック操作
- **設定**: 右クリック→オプションで詳細設定

### 言語切り替え / Language Switching
- 右上の言語スイッチャーで日本語⇔英語を切り替え
- ブラウザの言語設定を自動検出
- 設定は永続化されます

## 🚀 デプロイメント / Deployment

### 開発環境での起動 / Development Environment
```bash
# プロジェクトのビルド
npm run build

# PM2でサービス開始
pm2 start ecosystem.config.cjs

# アプリケーション確認
curl http://localhost:3000
```

### Chrome拡張機能のビルド / Chrome Extension Build
```bash
# 拡張機能ディレクトリに移動
cd extension/

# 本番用ビルド
node build.js

# Chromeに読み込み
# 1. chrome://extensions/ を開く
# 2. デベロッパーモードを有効にする  
# 3. 「パッケージ化されていない拡張機能を読み込む」
# 4. extension/build/ フォルダを選択
```

### Cloudflare Pages本番デプロイ / Production Deployment
```bash
# Cloudflare認証設定
setup_cloudflare_api_key

# プロダクション デプロイ
npm run deploy:prod

# D1データベースセットアップ
npx wrangler d1 create syncmark-production
npx wrangler d1 migrations apply syncmark-production
```

## 🛠️ 技術スタック / Tech Stack

### バックエンド / Backend
- **🔥 Hono**: 軽量高速Webフレームワーク
- **☁️ Cloudflare Workers**: エッジランタイム環境  
- **🗃️ Cloudflare D1**: 分散SQLiteデータベース
- **🔧 TypeScript**: 型安全な開発

### フロントエンド / Frontend  
- **🎨 TailwindCSS**: ユーティリティファーストCSS
- **🌐 Vanilla JavaScript**: 軽量でシンプル
- **🌏 i18n System**: カスタム多言語対応システム
- **📱 Responsive Design**: モバイル・デスクトップ対応

### Chrome拡張機能 / Chrome Extension
- **📋 Manifest V3**: 最新Chrome拡張API
- **🔄 Background Script**: Service Worker
- **📄 Content Script**: ページインジェクション  
- **🎯 Popup Interface**: クイック操作UI

### インフラ / Infrastructure
- **🚀 Cloudflare Pages**: 静的サイトホスティング
- **🌍 Cloudflare Edge Network**: グローバルCDN
- **💾 Chrome Storage API**: ローカルデータ管理

## 📋 実装済み機能 / Completed Features

### ✅ 基盤システム / Core System
- [x] Honoアプリケーション基盤
- [x] Cloudflare D1データベース設計
- [x] TypeScript型定義
- [x] RESTful API設計

### ✅ 認証システム / Authentication  
- [x] モックGoogle認証（MVP用）
- [x] セッション管理
- [x] トークンベース認証

### ✅ ブックマーク管理 / Bookmark Management
- [x] CRUD操作（作成・読取・更新・削除）
- [x] フォルダ階層構造
- [x] 検索・並び替え機能
- [x] お気に入り管理
- [x] タグ機能

### ✅ Chrome拡張機能 / Chrome Extension
- [x] Manifest V3対応
- [x] バックグラウンドスクリプト
- [x] コンテンツスクリプト
- [x] ポップアップUI
- [x] 設定ページ  
- [x] 浮遊ブックマークボタン

### ✅ 多言語対応 / Internationalization
- [x] 日本語・英語対応
- [x] 動的言語切り替え  
- [x] ブラウザ言語自動検出
- [x] 設定永続化

### ✅ UI/UX / User Interface
- [x] レスポンシブデザイン
- [x] ダークモード対応準備
- [x] アクセシビリティ考慮
- [x] 統計ダッシュボード

## 🚧 未実装機能 / Pending Features

### 🔄 認証システム強化 / Authentication Enhancement  
- [ ] 実際のGoogle OAuth実装
- [ ] 複数プロバイダー対応
- [ ] セキュリティ強化

### 🔄 同期機能 / Synchronization Features
- [ ] リアルタイム同期
- [ ] 競合解決アルゴリズム
- [ ] オフライン対応

### 🔄 UI/UX改善 / UI/UX Improvements  
- [ ] ドラッグ&ドロップ
- [ ] 一括操作
- [ ] ショートカットキー
- [ ] 通知システム

### 🔄 データ管理 / Data Management
- [ ] インポート/エクスポート
- [ ] バックアップ機能  
- [ ] データ分析

## 🎯 推奨次ステップ / Recommended Next Steps

### 1. 優先度：高 / High Priority
1. **実際のGoogle OAuth実装** / Real Google OAuth Implementation
   - Google Cloud Console設定
   - 本格的な認証フロー
   - セキュリティ強化

2. **Cloudflare本番デプロイ** / Cloudflare Production Deployment  
   - Cloudflare Pages設定
   - D1データベース本番環境
   - カスタムドメイン設定

3. **Chrome拡張機能アイコン作成** / Chrome Extension Icons
   - 16x16, 32x32, 48x48, 128x128 PNG
   - ブランディング統一

### 2. 優先度：中 / Medium Priority  
4. **リアルタイム同期実装** / Real-time Synchronization
   - WebSocket/Server-Sent Events
   - 競合解決ロジック
   - エラーハンドリング

5. **UI/UX改善** / UI/UX Enhancement
   - ドラッグ&ドロップ
   - アニメーション追加
   - パフォーマンス最適化

### 3. 優先度：低 / Low Priority
6. **機能拡張** / Feature Extension
   - ブックマーク共有機能
   - チーム機能
   - API公開

## 🔧 開発コマンド / Development Commands

```bash
# 開発サーバー起動
npm run dev:d1              # D1ローカル環境
npm run dev:sandbox         # サンドボックス環境

# ビルド・デプロイ  
npm run build               # プロジェクトビルド
npm run deploy              # 開発環境デプロイ
npm run deploy:prod         # 本番環境デプロイ

# データベース管理
npm run db:migrate:local    # ローカルマイグレーション
npm run db:migrate:prod     # 本番マイグレーション  
npm run db:seed             # テストデータ投入
npm run db:reset            # データベースリセット

# Git管理
npm run git:commit          # コミット作成
git status                  # ステータス確認
git log --oneline           # ログ確認

# テスト・確認
npm run test                # 接続テスト
curl http://localhost:3000/api/health  # ヘルスチェック
```

## 🐛 既知の課題 / Known Issues

### 技術的制約 / Technical Limitations
- **認証**: 現在はモック実装（本格OAuth必要）
- **アイコン**: 拡張機能アイコンが未作成  
- **同期**: 手動同期のみ（自動同期未実装）

### UX上の課題 / UX Issues  
- **ドラッグ&ドロップ**: フォルダ/ブックマークの移動が未対応
- **一括操作**: 複数選択・一括削除が未実装
- **オフライン**: ネットワーク切断時の対応が不十分

### セキュリティ / Security
- **トークン管理**: より安全な認証トークン管理が必要
- **CORS設定**: 本番環境でのCORS適切化
- **入力検証**: より厳密なバリデーション

## 📄 ライセンス / License
*未定 / To be determined*

## 👨‍💻 開発者情報 / Developer Information  
- **最終更新**: 2025年10月13日
- **開発状況**: MVP完了、Chrome拡張機能実装完了
- **次期バージョン**: v1.1（Google OAuth実装予定）

---

**🎉 SyncMark for Chrome - Chrome系ブラウザのためのブックマーク同期革命！**