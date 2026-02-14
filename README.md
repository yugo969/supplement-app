# サプリ KEEPER 💊

サプリメント服用管理アプリケーション - 個人開発による品質重視のWebアプリ

![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-blue)
![Firebase](https://img.shields.io/badge/Firebase-11.8.1-orange)
![Playwright](https://img.shields.io/badge/E2E-Playwright-green)
![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen)

## 📋 概要

サプリKEEPERは、個人のサプリメント服用を効率的に管理するWebアプリケーションです。
Firebase認証とFirestoreを活用し、安全で高速なデータ管理を実現しています。

### 🎯 主要機能

- **📝 サプリメント管理**: 追加・編集・削除・検索
- **⏰ 服用記録**: タイミング別（朝・昼・夜）服用管理
- **📊 摂取量追跡**: 残り数量・目標摂取量の可視化
- **🔐 安全認証**: Firebase Authentication による保護
- **📱 レスポンシブ**: モバイル・デスクトップ対応
- **⚡ 高速表示**: Next.js 15 + React 18による最適化

## 🛠️ 技術スタック

### フロントエンド

- **Framework**: Next.js 15.3.3 (App Router)
- **Language**: TypeScript 5.6.2
- **UI**: Tailwind CSS 3.3.3 + Radix UI
- **Animation**: Framer Motion 12.9.2
- **Icons**: Lucide React + React Icons

### バックエンド・データベース

- **認証**: Firebase Authentication 11.8.1
- **データベース**: Firestore（NoSQL）
- **ストレージ**: Firebase Storage

### 開発・品質管理ツール

- **Linter**: ESLint + TypeScript ESLint
- **Formatter**: Prettier 3.5.3
- **Form**: React Hook Form 7.56.1 + Zod 3.24.3
- **E2E Test**: Playwright 1.52.0（99テストケース）
- **Git Hooks**: Husky 8.0.0 + lint-staged

## 🚀 開発環境セットアップ

### 1. 前提条件

- Node.js 18.x以上
- npm（パッケージマネージャー）
- Firebase プロジェクト

### 2. インストール

```bash
# リポジトリクローン
git clone [repository-url]
cd supplement-app

# サブモジュール初期化（.cursor設定ファイル用）
git submodule init
git submodule update

# 依存関係インストール
npm install

# Husky（Git Hooks）設定
npm run prepare
```

### 3. Firebase設定

`.env.local` ファイルを作成し、Firebase設定を追加：

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### 4. 開発サーバー起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## 🧪 テスト・品質管理

### コード品質チェック

```bash
# TypeScript型チェック
npm run type-check

# ESLint実行
npm run lint

# ESLint自動修正
npm run lint:fix

# Prettier整形
npm run format

# Prettier チェック
npm run format:check
```

### E2Eテスト実行

**重要**: E2Eテストには99のテストケースが含まれます

```bash
# 全テスト実行
npm run test:e2e

# UI表示でテスト実行
npm run test:e2e:ui

# デバッグモード
npm run test:e2e:debug

# ヘッドありモード（ブラウザ表示）
npm run test:e2e:headed

# テストレポート表示
npm run test:e2e:report
```

#### ⚠️ テスト実行時の注意事項（2025-05-31更新）

**日付変更テストの技術的制約について:**

- `tests/e2e/regression/date-reset.spec.ts` の一部テストが技術的課題により `test.skip()` でスキップ中
- **アプリケーション機能は正常動作**: 日付変更リセット機能は本番環境で正常稼働
- **影響範囲**: テスト技術実装のみ（99テスト中96テストが安定稼働）
- **対応方針**: リファクタリング優先、E2Eテスト修正は Phase 7 で対応予定

#### テストカテゴリ

1. **認証テスト** (`tests/e2e/auth`)

   - ログイン・ログアウト・新規登録
   - 認証状態管理・エラーハンドリング

2. **サプリメント管理テスト** (`tests/e2e/supplements`)

   - CRUD操作・検索・フィルタリング
   - フォームバリデーション

3. **服用記録テスト** (`tests/e2e/regression/dosage-tracking.spec.ts`)

   - タイミング別服用記録
   - 残量追跡・回帰防止

4. **UI表示テスト** (`tests/e2e/ui`)
   - レスポンシブデザイン
   - コンポーネント表示制御

## 🔧 リファクタリング支援

### リファクタリング前チェック

重要機能の動作を事前確認して、安全なリファクタリングを実行：

```bash
# リファクタリング前チェック実行
./scripts/pre-refactor-check.sh
```

**チェック内容**:

- TypeScript型チェック
- Next.jsビルド確認
- 重要E2Eテスト（認証・CRUD・服用記録）
- 結果レポート生成

### Git Commit時の自動チェック

Huskyにより、コミット前に自動実行：

```bash
# 通常のコミット（自動チェック実行）
git commit -m "コミットメッセージ"

# 緊急時（E2Eテストスキップ）
SKIP_E2E=1 git commit -m "緊急コミット"
```

## 📁 プロジェクト構造

```
supplement-app/
├── .cursor/               # AI設定（Gitサブモジュール）
│   ├── docs/             # AI・開発ドキュメント
│   ├── rules/            # CursorAI設定ルール
│   └── .cursorrules      # AI支援設定
├── src/
│   ├── components/        # 再利用可能UIコンポーネント
│   ├── context/           # React Context
│   ├── hooks/             # カスタムフック
│   ├── lib/               # ユーティリティ・Firebase連携
│   ├── pages/             # ページコンポーネント
│   ├── schemas/           # Zodバリデーションスキーマ
│   └── styles/            # グローバルスタイル
├── tests/
│   └── e2e/               # E2Eテスト（99ケース）
├── scripts/               # 開発支援スクリプト
└── .github/workflows/     # CI/CD設定
```

## 🎨 UI/UXデザイン

- **デザインシステム**: Radix UI + カスタムデザイン
- **カラーパレット**: モダンで視認性の高い配色
- **レスポンシブ**: Mobile-first設計
- **アクセシビリティ**: ARIA属性・キーボード対応

## 🚀 デプロイ・CI/CD

### 個人開発モード（現在）

- **ローカル開発**: Husky pre-commit統合
- **品質保証**: リファクタリング前チェックスクリプト
- **テスト実行**: 手動 + Git Hook自動実行

### プロダクション移行時

GitHub Actions対応済み（`.cursor/docs/e2e-cicd-template.md`参照）:

- **PR用**: 重要テストのみ（5分実行）
- **Main用**: 全99テスト包括実行（20分）
- **手動実行**: 必要に応じた実行範囲選択

## 📚 ドキュメント

- `.cursor/docs/project-overview.yaml` - プロジェクト全体概要
- `.cursor/docs/uiux-improvement-log.md` - UI/UX改善の計画・実装ログ
- `.cursor/docs/e2e-test-integration-checklist.md` - E2Eテスト導入手順
- `.cursor/docs/e2e-cicd-template.md` - CI/CD移行テンプレート

## 🤝 開発ガイドライン

### コーディング規約

1. **TypeScript**: 厳格な型定義
2. **ESLint**: Next.js推奨設定 + 追加ルール
3. **Prettier**: 一貫したコード整形
4. **Zod**: スキーマファーストバリデーション

### Git運用

1. **Commit**: Conventional Commits準拠
2. **Branch**: feature/fix/docs分離
3. **Pre-commit**: 自動品質チェック
4. **E2E**: リファクタリング前後の動作確認

## 🔒 セキュリティ

- **認証**: Firebase Authentication
- **データアクセス**: Firestore Security Rules
- **クライアント検証**: Zod + React Hook Form
- **依存関係**: Dependabot自動セキュリティ更新

## 📞 サポート・連絡先

個人開発プロジェクトのため、Issuesやプルリクエストはプロジェクト管理者が対応します。

---

## 🏆 品質指標

- **E2Eテスト**: 99ケース実装済み
- **TypeScript**: 厳格な型安全性
- **コードカバレッジ**: 重要機能100%
- **パフォーマンス**: Next.js最適化適用
- **セキュリティ**: Firebase + Firestore Rules

**最終更新**: リファクタリング連携体制確立（Phase 6完了）

# ポート3100設定テスト

## ⚙️ .cursor サブモジュール管理

### 概要

`.cursor`ディレクトリは**Gitサブモジュール**として分離管理されています：

- **目的**: AI設定とプロジェクトコードの履歴分離
- **利点**: 個人設定の独立管理、リポジトリサイズ削減
- **管理**: 別リポジトリ（cursor-config）で管理

### 基本的な管理方法

```bash
# .cursor内での設定変更
cd .cursor
git add .
git commit -m "Update AI assistant settings"
git push

# メインリポジトリでの同期（推奨：整合性重視）
cd ..
git add .cursor
git commit -m "Update .cursor submodule to latest"
git push
```

### 新しい環境での初期セットアップ

```bash
# リポジトリクローン時
git clone [repository-url]
cd supplement-app

# サブモジュール初期化
git submodule init
git submodule update
```

### 詳細な管理方法

.cursorサブモジュールの詳細な管理方法は、サブモジュール内のドキュメントを参照：

- `.cursor/docs/cursor-submodule-management.md` - 完全な管理ガイド

## 📚 ドキュメント管理

### ドキュメント配置方針

```yaml
メインリポジトリ:
  - README.md: プロジェクト概要・セットアップ手順
  - 技術仕様・アーキテクチャドキュメント（将来追加予定）

.cursorサブモジュール (.cursor/docs/):
  - AI支援設定・開発ルール
  - ディレクトリ構造・技術スタック詳細
  - E2Eテスト統合ガイド
  - 開発ワークフロー・チェックリスト
```

### ドキュメント作成時の注意点

1. **AI・開発設定関連** → `.cursor/docs/` に配置
2. **プロジェクト技術仕様** → メインリポジトリ`docs/`（今後作成予定）
3. **混在回避**: 関心の分離を厳密に遵守
