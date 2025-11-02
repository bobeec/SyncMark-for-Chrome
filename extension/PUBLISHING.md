# SyncMark Chrome Extension - Publishing Guide

このドキュメントでは、SyncMark Chrome拡張機能をChrome Web Storeに公開する手順を説明します。

## 📋 公開前チェックリスト

### 必須項目
- [x] アイコン作成完了（16x16, 32x32, 48x48, 128x128）
- [x] manifest.json の設定完了
- [x] 拡張機能のビルド完了
- [x] ZIPパッケージの作成完了
- [ ] Chrome Web Store Developer アカウント登録
- [ ] プロモーション素材の準備
- [ ] プライバシーポリシーの作成
- [ ] 利用規約の作成

### 推奨項目
- [ ] スクリーンショット（最低1枚、推奨5枚）
- [ ] プロモーション用画像（440x280px）
- [ ] プロモーション用タイル（1400x560px）
- [ ] 紹介動画（YouTube）
- [ ] サポートページのURL
- [ ] 詳細な説明文（日本語・英語）

## 📦 ビルド済みパッケージ

以下のファイルが準備されています：

```
extension/
├── build/                              # 開発用（アンパック版）
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.css
│   ├── options.html
│   ├── src/
│   │   ├── background.js
│   │   ├── content.js
│   │   ├── popup.js
│   │   ├── options.js
│   │   └── i18n.js
│   └── icons/
│       ├── icon-16.png
│       ├── icon-32.png
│       ├── icon-48.png
│       └── icon-128.png
└── syncmark-chrome-extension-v1.0.0.zip  # 配布用ZIPパッケージ
```

## 🚀 Chrome Web Store 公開手順

### Step 1: Chrome Web Store Developer アカウント登録

1. **Developer Dashboard にアクセス**
   ```
   https://chrome.google.com/webstore/devconsole
   ```

2. **登録料の支払い**
   - 初回のみ $5 の登録料が必要
   - クレジットカードまたはデビットカードで支払い

3. **Developer アカウント情報の入力**
   - メールアドレス
   - 発行者名（例: SyncMark Team）
   - ウェブサイトURL（例: https://github.com/bocotime/SyncMark-for-Chrome）

### Step 2: 拡張機能のアップロード

1. **新しいアイテムを作成**
   - Developer Dashboard で「新しいアイテム」をクリック
   - ZIPファイルをアップロード: `syncmark-chrome-extension-v1.0.0.zip`

2. **基本情報の入力**

   #### 拡張機能名
   - **日本語**: SyncMark for Chrome
   - **英語**: SyncMark for Chrome

   #### 概要（132文字以内）
   - **日本語**: Chrome系ブラウザ間でブックマークを同期できるサービス。リアルタイム同期、フォルダ管理、お気に入り機能を提供。
   - **英語**: Bookmark synchronization service for Chrome-based browsers with real-time sync, folder management, and favorites.

   #### 詳細な説明
   ```markdown
   # SyncMark for Chrome - ブックマーク同期革命

   ## 主な機能
   ✅ リアルタイムブックマーク同期
   ✅ 複数デバイス間での自動同期
   ✅ フォルダ階層管理
   ✅ お気に入り機能
   ✅ 高度な検索・並び替え
   ✅ 日本語・英語対応
   ✅ セキュアなGoogle認証

   ## 使い方
   1. 拡張機能をインストール
   2. Googleアカウントでログイン
   3. ブックマークが自動的に同期開始
   4. 他のデバイスでも同じアカウントでログイン

   ## 特徴
   - 🔒 プライバシー重視の設計
   - ⚡ 高速な同期処理
   - 🎨 美しいUI/UX
   - 📱 モバイル対応Webアプリ

   ## サポート
   問題や質問がある場合は、GitHubリポジトリをご覧ください：
   https://github.com/bocotime/SyncMark-for-Chrome
   ```

3. **カテゴリの選択**
   - **プライマリカテゴリ**: Productivity（生産性）
   - **セカンダリカテゴリ**: Communication（コミュニケーション）

4. **言語の設定**
   - 日本語（Japanese）
   - 英語（English）

### Step 3: プロモーション素材のアップロード

#### 必須素材

1. **スクリーンショット**（最低1枚、最大5枚推奨）
   - サイズ: 1280x800px または 640x400px
   - 形式: PNG または JPEG
   - 推奨内容:
     - ポップアップUIのスクリーンショット
     - オプション画面のスクリーンショット
     - ブックマーク一覧画面
     - 浮遊ボタンの使用例
     - 検索機能のデモ

2. **アイコン**（自動取得）
   - 128x128pxアイコンがmanifestから自動的に使用されます

#### 推奨素材（後から追加可能）

1. **プロモーション用小画像** (Promotional small tile)
   - サイズ: 440x280px
   - 形式: PNG または JPEG

2. **プロモーション用大画像** (Promotional large tile)
   - サイズ: 1400x560px
   - 形式: PNG または JPEG

3. **紹介動画**
   - YouTube動画のURL
   - 長さ: 30秒〜2分推奨

### Step 4: プライバシー設定

1. **プライバシーポリシー**
   - プライバシーポリシーのURL: `https://github.com/bocotime/SyncMark-for-Chrome/blob/main/PRIVACY.md`

2. **権限の説明**
   ```
   - bookmarks: ブックマークの読み取りと保存に必要
   - storage: ローカルキャッシュの保存に必要
   - activeTab: 現在のページ情報の取得に必要
   - tabs: ブックマークのタブ情報取得に必要
   - host_permissions: Webアプリとの通信に必要
   ```

3. **データ使用の説明**
   - ユーザーのブックマークデータは暗号化して保存
   - Googleアカウント情報は認証にのみ使用
   - 第三者とデータを共有しない

### Step 5: 配信設定

1. **価格設定**
   - **無料** を選択

2. **配信地域**
   - すべての地域を選択（またはターゲット地域を指定）

3. **可視性**
   - **公開**: すべてのユーザーに表示
   - **非公開**: 特定のテスター/ユーザーのみ

### Step 6: レビュー申請

1. **すべての項目を確認**
   - 赤いエラーメッセージがないことを確認
   - すべての必須フィールドが入力されていることを確認

2. **「審査を申請」をクリック**
   - 審査には通常数日〜1週間程度かかります
   - 審査ステータスはDashboardで確認できます

3. **審査結果の通知**
   - 承認された場合: 自動的に公開されます
   - 却下された場合: 理由が通知され、修正後に再申請可能

## 📝 審査でよく指摘される項目

### よくある却下理由

1. **権限の説明不足**
   - すべての権限について、なぜ必要なのか明確に説明する

2. **プライバシーポリシーの不備**
   - データの収集、使用、保存方法を詳細に記載
   - ユーザーの権利（データ削除など）を明記

3. **機能説明の不足**
   - 拡張機能の機能を詳細に説明
   - スクリーンショットで機能を視覚的に示す

4. **manifest.jsonのエラー**
   - 構文エラーや非推奨のAPIの使用
   - 不要な権限のリクエスト

5. **コンテンツの品質**
   - 動作しない機能がある
   - エラーやバグが多い
   - UIが不完全

### 審査通過のコツ

1. **詳細な説明を提供**
   - 各機能の目的を明確に
   - スクリーンショットを豊富に用意

2. **最小限の権限をリクエスト**
   - 本当に必要な権限のみをリクエスト
   - 各権限の必要性を説明

3. **高品質なUI/UX**
   - バグを事前に修正
   - ユーザーフレンドリーなデザイン

4. **透明性の確保**
   - プライバシーポリシーを公開
   - オープンソースの場合、GitHubリポジトリを公開

## 🔄 更新版の公開

バージョンアップ時の手順：

1. **manifest.jsonのバージョンを更新**
   ```json
   "version": "1.0.1"
   ```

2. **変更内容を記録**
   - CHANGELOGを更新
   - リリースノートを作成

3. **ビルドとZIP作成**
   ```bash
   cd extension
   node build.cjs
   zip -r syncmark-chrome-extension-v1.0.1.zip build/
   ```

4. **Developer Dashboard で更新**
   - 既存のアイテムを選択
   - 新しいZIPファイルをアップロード
   - 変更内容を説明
   - 「審査を申請」

## 📊 公開後の管理

### 統計情報の確認
- インストール数
- アクティブユーザー数
- ユーザーレビュー
- 評価スコア

### ユーザーフィードバック
- レビューに返信
- 問題の報告に対応
- 機能要望の収集

### 継続的な改善
- バグ修正の定期リリース
- 新機能の追加
- セキュリティアップデート

## 🛡️ セキュリティとコンプライアンス

### セキュリティベストプラクティス
- 定期的なセキュリティ監査
- 依存関係の更新
- 脆弱性の迅速な修正

### コンプライアンス
- GDPR準拠（EUユーザー向け）
- CCPA準拠（カリフォルニアユーザー向け）
- その他の地域規制の遵守

## 📚 参考リンク

- [Chrome Web Store Developer Documentation](https://developer.chrome.com/docs/webstore/)
- [Extension Quality Guidelines](https://developer.chrome.com/docs/webstore/program-policies/)
- [Review Process](https://developer.chrome.com/docs/webstore/review-process/)
- [Best Practices](https://developer.chrome.com/docs/webstore/best-practices/)

---

**🎉 公開準備完了！Chrome Web Storeでのご成功をお祈りします！**
