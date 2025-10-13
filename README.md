# SyncMark for Chrome

Chrome系ブラウザ対応ブックマーク同期サービス / Bookmark Synchronization Service for Chrome-based Browsers

## プロジェクト概要 / Project Overview

**日本語:**
- **名前**: SyncMark for Chrome
- **目標**: Chrome系ブラウザ間でブックマークを同期し、派生ブラウザでも同じブックマークを使用できるサービス
- **特徴**: 
  - Chrome拡張機能による自動同期
  - 多言語対応（日本語・英語）
  - レスポンシブデザイン
  - フォルダ階層サポート
  - お気に入り機能

**English:**
- **Name**: SyncMark for Chrome
- **Goal**: Synchronize bookmarks across Chrome-based browsers, enabling use of the same bookmarks in derivative browsers
- **Features**: 
  - Automatic sync via Chrome extension
  - Multilingual support (Japanese/English)
  - Responsive design
  - Folder hierarchy support
  - Favorites feature

## URL情報 / URLs

- **開発サーバー / Development Server**: https://3000-iieuh916jtoaqqegoxuy4-c81df28e.sandbox.novita.ai
- **ヘルスチェック / Health Check**: https://3000-iieuh916jtoaqqegoxuy4-c81df28e.sandbox.novita.ai/api/health
- **GitHub**: 未設定 / Not configured yet

## データアーキテクチャ / Data Architecture

### データモデル / Data Models
1. **Users (ユーザー)**: Google認証によるユーザー管理
2. **Folders (フォルダ)**: 階層構造対応のブックマークフォルダ
3. **Bookmarks (ブックマーク)**: URL、タイトル、説明、タグ、お気に入りフラグ
4. **Sync Sessions (同期セッション)**: Chrome拡張機能との同期管理

### ストレージサービス / Storage Services
- **Cloudflare D1**: SQLiteベースのグローバル分散データベース
- **データベース名**: syncmark-production
- **ローカル開発**: `--local`フラグで自動的にローカルSQLite使用

### データフロー / Data Flow
1. Webアプリ ↔ Hono API (REST)
2. Chrome拡張機能 ↔ Hono API (同期)
3. D1データベースによる永続化

## 技術スタック / Tech Stack

### バックエンド / Backend
- **Hono**: 軽量Webフレームワーク
- **Cloudflare Workers**: エッジランタイム
- **Cloudflare D1**: SQLiteデータベース
- **TypeScript**: 型安全な開発

### フロントエンド / Frontend
- **TailwindCSS**: ユーティリティファーストCSS
- **Vanilla JavaScript**: フレームワークレス
- **Font Awesome**: アイコンライブラリ
- **カスタムi18n**: 多言語対応システム

### 開発ツール / Development Tools
- **Vite**: ビルドツール
- **Wrangler**: Cloudflare CLI
- **PM2**: プロセス管理

## 現在の実装状況 / Current Implementation Status

### ✅ 完了済み機能 / Completed Features

1. **プロジェクトセットアップ**
   - Honoプロジェクト初期化
   - D1データベース設定
   - PM2設定

2. **多言語対応システム**
   - 日本語・英語対応
   - 動的言語切り替え
   - ブラウザ言語自動検出
   - 言語設定永続化

3. **データベース設計**
   - ユーザー管理テーブル
   - フォルダ階層テーブル
   - ブックマークテーブル
   - 同期セッションテーブル

4. **API実装**
   - 認証API (モック実装)
   - ブックマークCRUD API
   - フォルダCRUD API
   - 同期API

5. **UIフレームワーク**
   - レスポンシブデザイン
   - 統計表示カード
   - フォルダ階層表示
   - ブックマーク一覧表示

### 🔄 現在実装中 / Currently Implementing

1. **MVP基本機能**
   - フロントエンド・バックエンド連携
   - 基本的なCRUD操作
   - データ表示機能

### ⏳ 未実装機能 / Pending Features

1. **Chrome拡張機能**
   - manifest.json作成
   - ブックマーク操作権限
   - 自動同期機能
   - バックグラウンドスクリプト

2. **本格的な認証システム**
   - Google OAuth 2.0実装
   - セキュアなトークン管理
   - セッション管理強化

3. **UI/UX改善**
   - モーダルダイアログ
   - ドラッグ&ドロップ
   - 検索・フィルタリング
   - エクスポート/インポート

4. **データ同期機能**
   - リアルタイム同期
   - 競合解決
   - オフライン対応

## ユーザーガイド / User Guide

### 基本的な使い方 / Basic Usage

1. **ログイン**: 「Googleでログイン」ボタンをクリック（現在はモック実装）
2. **ブックマーク追加**: 「Add Bookmark」ボタンから新しいブックマークを追加
3. **フォルダ作成**: 「Add Folder」ボタンから整理用フォルダを作成
4. **言語切り替え**: ヘッダー右上の言語スイッチャーで日英切り替え
5. **同期**: 「Sync Now」ボタンでChrome拡張機能と同期

### Chrome拡張機能 / Chrome Extension
- **インストール**: まだ開発中（今後Chrome Web Storeで配布予定）
- **自動同期**: インストール後、ブラウザのブックマーク操作を自動的に同期

### データ管理 / Data Management
- **エクスポート**: 「Export」ボタンでブックマークデータをJSON形式で出力
- **バックアップ**: データはCloudflare D1に安全に保存
- **プライバシー**: ユーザーごとにデータを分離、安全な認証

## デプロイメント / Deployment

### 開発環境 / Development Environment
```bash
# プロジェクトのセットアップ
npm install

# ローカル開発サーバー起動
npm run build
npm run dev:d1

# データベースマイグレーション
npm run db:migrate:local

# テストデータ追加
npm run db:seed
```

### 本番環境 / Production Environment
- **プラットフォーム**: Cloudflare Pages
- **ステータス**: 開発中 / In Development
- **データベース**: Cloudflare D1 (syncmark-production)
- **最終更新**: 2025-10-13

### 環境変数 / Environment Variables
```bash
# ローカル開発用 (.dev.vars)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# 本番環境用 (Cloudflare Secrets)
# wrangler secret put GOOGLE_CLIENT_ID
# wrangler secret put GOOGLE_CLIENT_SECRET
```

## 開発マイルストーン / Development Milestones

### Phase 1: MVP (現在) / MVP (Current)
- [x] プロジェクトセットアップ
- [x] 多言語対応実装
- [x] 基本API実装
- [ ] フロントエンド機能完成
- [ ] 基本的なCRUD操作

### Phase 2: Chrome拡張機能 / Chrome Extension
- [ ] manifest.json作成
- [ ] ブックマーク操作API連携
- [ ] 自動同期実装
- [ ] Chrome Web Store申請

### Phase 3: 認証・セキュリティ / Authentication & Security
- [ ] Google OAuth 2.0実装
- [ ] セキュアなセッション管理
- [ ] データ暗号化

### Phase 4: 高度な機能 / Advanced Features
- [ ] リアルタイム同期
- [ ] 競合解決機能
- [ ] インポート/エクスポート
- [ ] 検索・タグ機能

### Phase 5: 最適化・拡張 / Optimization & Extension
- [ ] パフォーマンス最適化
- [ ] 他ブラウザ対応
- [ ] モバイルアプリ対応
- [ ] チーム共有機能

## 推奨される次のステップ / Recommended Next Steps

1. **フロントエンドCRUD機能の完成**
   - ブックマーク追加・編集・削除モーダル
   - フォルダ管理機能
   - 検索・フィルタリング

2. **Chrome拡張機能のプロトタイプ作成**
   - 基本的なmanifest.json
   - ブックマーク読み取り権限
   - APIとの基本通信

3. **Google OAuth認証の実装**
   - Cloudflare環境でのOAuth設定
   - セキュアなトークン管理
   - セッション管理強化

4. **デモ用サンプルデータの充実**
   - より現実的なテストデータ
   - 様々なユースケースのデモ

## 技術的な注意点 / Technical Notes

### Cloudflare Workers制限 / Cloudflare Workers Limitations
- **CPUタイム制限**: リクエストあたり10ms（無料）/ 30ms（有料）
- **メモリ制限**: 128MB
- **ファイルシステムアクセス不可**: `fs`モジュール使用不可
- **Node.js API制限**: Web標準APIのみ使用可能

### D1データベース特徴 / D1 Database Features
- **SQLiteベース**: 標準SQLクエリ対応
- **グローバル分散**: エッジロケーションでの高速アクセス
- **読み書き一貫性**: 最終的一貫性モデル
- **ローカル開発**: `--local`フラグでローカルSQLite使用

### 多言語対応設計 / i18n Design
- **軽量実装**: 外部ライブラリ不使用のカスタム実装
- **動的読み込み**: 必要な言語ファイルのみ読み込み
- **フォールバック**: 英語をデフォルト言語として設定
- **ブラウザ対応**: navigator.languageによる自動言語検出

## ライセンス / License

TBD - プロジェクト完成後にライセンスを決定予定

## 貢献 / Contributing

現在は個人プロジェクトとして開発中。今後、オープンソース化を検討予定。

---

**最終更新 / Last Updated**: 2025-10-13
**バージョン / Version**: 0.1.0-MVP
**開発状況 / Status**: MVP開発中 / MVP in Development