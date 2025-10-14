# Contributing to SyncMark for Chrome

## 🎯 はじめに / Getting Started

SyncMark for Chrome へのコントリビューションをありがとうございます！  
Thank you for your interest in contributing to SyncMark for Chrome!

このドキュメントでは、プロジェクトへの貢献方法について説明します。  
This document outlines how to contribute to this project.

## 🚀 開発環境のセットアップ / Development Setup

### 必要な環境 / Prerequisites

- Node.js 18+ 
- npm 8+
- Git
- Chrome ブラウザ / Chrome browser

### ローカル開発 / Local Development

1. **リポジトリのフォーク / Fork the repository**
   ```bash
   # GitHub でフォークしてから / After forking on GitHub
   git clone https://github.com/YOUR_USERNAME/SyncMark-for-Chrome.git
   cd SyncMark-for-Chrome
   ```

2. **依存関係のインストール / Install dependencies**
   ```bash
   npm install
   ```

3. **開発サーバーの起動 / Start development server**
   ```bash
   npm run build
   pm2 start ecosystem.config.cjs
   ```

4. **Chrome拡張機能の読み込み / Load Chrome extension**
   ```bash
   cd extension
   node build.cjs
   # Chrome で chrome://extensions/ を開き、build/ フォルダを読み込み
   # Open chrome://extensions/ and load the build/ folder
   ```

## 🔄 コントリビューションの流れ / Contribution Workflow

### 1. Issue の確認 / Check Issues

- 既存の Issue を確認してください / Check existing issues first
- 新しい機能や修正の提案は Issue を作成してください / Create an issue for new features or fixes
- バグ報告は詳細な再現手順を含めてください / Include detailed reproduction steps for bugs

### 2. ブランチの作成 / Create Branch

```bash
# メインブランチから作成 / Create from main branch
git checkout main
git pull origin main
git checkout -b feature/your-feature-name

# または / or
git checkout -b fix/bug-description
```

### 3. 開発とテスト / Development and Testing

- **コードスタイル / Code Style**: 既存のコードスタイルに従ってください / Follow existing code style
- **コミット / Commits**: 意味のあるコミットメッセージを書いてください / Write meaningful commit messages
- **テスト / Testing**: 変更をテストしてください / Test your changes

```bash
# ビルドテスト / Build test
npm run build

# 拡張機能テスト / Extension test
cd extension && node build.cjs

# API テスト / API test
curl http://localhost:3000/api/health
```

### 4. Pull Request の作成 / Create Pull Request

- PR テンプレートに従って詳細を記載してください / Fill out the PR template with details
- 変更内容を明確に説明してください / Clearly describe your changes
- スクリーンショットがあれば追加してください / Add screenshots if applicable

## 📝 コーディング規約 / Coding Guidelines

### TypeScript/JavaScript

- **TypeScript を使用** / Use TypeScript for type safety
- **ESLint 規約に従う** / Follow ESLint rules
- **関数には適切な型注釈を追加** / Add proper type annotations to functions

```typescript
// ✅ Good
async function createBookmark(data: CreateBookmarkRequest): Promise<Bookmark> {
  // implementation
}

// ❌ Bad
async function createBookmark(data) {
  // implementation
}
```

### コミットメッセージ / Commit Messages

```bash
# 形式 / Format
<type>(<scope>): <description>

# 例 / Examples
feat(api): add bookmark search functionality
fix(extension): resolve popup authentication issue  
docs(readme): update installation instructions
```

**Types:**
- `feat`: 新機能 / New feature
- `fix`: バグ修正 / Bug fix
- `docs`: ドキュメント / Documentation
- `style`: コードスタイル / Code style
- `refactor`: リファクタリング / Refactoring
- `test`: テスト / Testing
- `chore`: その他 / Maintenance

### ディレクトリ構造 / Directory Structure

```
src/
  ├── routes/          # API routes
  ├── types.ts         # TypeScript type definitions
  └── index.tsx        # Main application entry

extension/
  ├── src/             # Extension source code
  ├── build/           # Built extension (generated)
  ├── manifest.json    # Extension manifest
  └── *.html          # Extension UI files

public/
  ├── static/          # Static assets
  └── i18n/           # Internationalization files
```

## 🌐 多言語対応 / Internationalization

新しいテキストを追加する場合：  
When adding new text:

1. **翻訳キーを追加** / Add translation keys
   ```javascript
   // public/static/i18n/en.json
   {
     "newFeature.title": "New Feature"
   }
   
   // public/static/i18n/ja.json  
   {
     "newFeature.title": "新機能"
   }
   ```

2. **HTMLで使用** / Use in HTML
   ```html
   <h1 data-i18n="newFeature.title">New Feature</h1>
   ```

3. **JavaScriptで使用** / Use in JavaScript
   ```javascript
   const title = window.i18n.t('newFeature.title')
   ```

## 🐛 バグ報告 / Bug Reports

バグを見つけた場合：  
When you find a bug:

1. **既存の Issue を確認** / Check existing issues
2. **再現手順を明確にする** / Provide clear reproduction steps  
3. **環境情報を含める** / Include environment information
4. **期待される動作を説明** / Describe expected behavior

## 💡 機能提案 / Feature Requests  

新機能を提案する場合：  
When suggesting new features:

1. **ユースケースを説明** / Describe the use case
2. **既存の代替案を検討** / Consider existing alternatives
3. **実装の複雑さを考慮** / Consider implementation complexity
4. **Issue で議論** / Discuss in an issue first

## 📋 レビュープロセス / Review Process

1. **自動テスト** / Automated tests run on all PRs
2. **コードレビュー** / Code review by maintainers
3. **変更のテスト** / Testing of changes
4. **ドキュメント更新** / Documentation updates if needed
5. **マージ** / Merge after approval

## 🆘 ヘルプが必要な場合 / Getting Help

- **Issue を作成** / Create an issue for questions
- **既存の Issue を確認** / Check existing issues and discussions
- **ドキュメントを参照** / Refer to documentation in README.md

## 📄 ライセンス / License

コントリビューションを行うことで、あなたの変更が同じライセンスの下で公開されることに同意したものとみなされます。  
By contributing, you agree that your contributions will be licensed under the same license as the project.

---

**ありがとうございます！/ Thank you for contributing!** 🎉