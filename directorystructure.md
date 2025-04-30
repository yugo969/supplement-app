# ディレクトリ構成（※本記載は記入例です-プロジェクトに合わせて内容を更新してください-）

以下のディレクトリ構造に従って実装を行ってください：

/
├── src/ # アプリケーションソースコード
│ ├── components/ # アプリケーションコンポーネント
│ │ └──ui/ # 基本 UI（button, dialog, toast, etc.）
│ ├── hooks/ # カスタムフック
│ ├── lib/ # ユーティリティ
│ │ ├── firebaseClient.ts # Firebase クライアント設定
│ │ ├── firestore.ts # Firestore 操作
│ │ ├── resizeImage.ts # 画像リサイズユーティリティ
│ │ ├── useNotification.ts # 通知用ユーティリティ
│ │ └── utils.ts # 共通関数
│ ├── pages/ # Next.js ページ
│ │ ├── \_app.tsx # アプリケーションルート
│ │ ├── \_document.tsx # ドキュメント定義
│ │ ├── index.tsx # ホームページ
│ │ ├── login.tsx # ログインページ
│ │ └── signup.tsx # サインアップページ
│ ├── providers/ # コンテキストプロバイダー
│ └── styles/ # スタイル定義
│ └── globals.css
├── public/ # 静的ファイル
├── node_modules/ # 依存パッケージ
├── .git/ # Git リポジトリ
├── package.json # プロジェクト設定
├── package-lock.json # 依存関係ロックファイル
├── tsconfig.json # TypeScript 設定
├── next-env.d.ts # Next.js 型定義
├── next.config.js # Next.js 設定
├── postcss.config.js # PostCSS 設定
├── .eslintrc.json # ESLint 設定
├── .eslintignore # ESLint 除外設定
├── tailwind.config.js # Tailwind CSS 設定
├── README.md # プロジェクト概要
├── components.json # shadcn/ui コンポーネント設定
└── cors.json # CORS 設定ファイル

### 配置ルール

- UI コンポーネント → `src/components/ui/`
- API エンドポイント → `src/pages/api/`
- 共通処理 → `src/lib/utils/`
