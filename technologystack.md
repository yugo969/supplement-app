# 技術スタック（※プロジェクトに合わせて内容を更新してください）

## コア技術

- TypeScript: ^5.2.2
- Node.js: ^20.0.0 （推奨）
- Firebase: ^10.3.1
  - 認証、Firestore、Storage などを利用

## フロントエンド

- Next.js: 13.4.19
- React: 18.2.0
- Tailwind CSS: ^3.3.3
- shadcn/ui: ^0.9.5
- Sonner: ^2.0.2 （トースト通知用）
- next-themes: ^0.4.6

## バックエンド

- Firebase:
  - Firestore、Authentication、Storage などのサービスを活用

## 開発ツール

- npm: ^10.0.0
- ESLint: 8.48.0
- TypeScript: ^5.2.2

---

# API バージョン管理および実装規則

## 重要な制約事項

- Firebase クライアント設定
  - `src/lib/firebaseClient.ts` にて一元管理
  - API キーやプロジェクト設定は環境変数（例: .env.local など）を介して提供すること
- これらのファイルは変更禁止（変更が必要な場合は承認が必要）：
  <!-- - types.ts - 型定義の一元管理
  - config.ts - 環境設定の一元管理 -->
  - firebaseClient.ts
  - Firebase の設定ファイルはセキュリティ上重要なため、変更が必要な場合は事前の承認を得る

## 実装規則

<!-- - 型定義は必ず types.ts を参照 -->

- Firebase 関連の設定は `src/lib/firebaseClient.ts` でのみ定義し、個別の変更は行わない
- 型定義は可能な限り共通の型ファイルや TypeScript の仕組みを活用する
- 設定ファイルは、プロジェクト全体で一貫性を保つために共通ファイルを参照する
- 環境変数の利用は、セキュリティおよび運用の観点から厳密に管理する
