# ディレクトリ構成

以下のディレクトリ構造に従って実装を行ってください：

/
├── .cursor/ # Cursor 用ルール
│ └── rules/
│ └── global.mdc
├── docs/ # ドキュメント
│ └── project-overview.yaml
├── functions/ # Firebase Functions（Cloud Functions）
│ ├── src/
│ │ └── index.ts # 定期バッチ（takenTimings リセット）
│ ├── .eslintrc.js
│ ├── .gitignore
│ ├── package.json
│ ├── tsconfig.json
│ └── tsconfig.dev.json
├── public/ # 静的アセット
│ ├── next.svg
│ └── vercel.svg
├── src/ # アプリケーションソースコード
│ ├── components/ # アプリケーションコンポーネント
│ │ ├── NotificationPopup.tsx
│ │ └── ui/ # 基本 UI（button, dialog, form, など）
│ │ ├── button.tsx
│ │ ├── card.tsx
│ │ ├── dialog.tsx
│ │ ├── form.tsx
│ │ ├── input.tsx
│ │ └── label.tsx
│ ├── context/ # コンテキスト
│ │ └── AuthContext.tsx
│ ├── hooks/ # カスタムフック
│ │ └── useAuth.ts
│ ├── lib/ # ユーティリティ & Firebase 連携
│ │ ├── firebaseClient.ts # Firebase クライアント設定（変更禁止）
│ │ ├── firestore.ts # Firestore 操作
│ │ ├── resizeImage.ts # 画像リサイズ
│ │ ├── useNotification.ts # 通知フック
│ │ └── utils.ts # 共通関数
│ ├── pages/ # Next.js ページ
│ │ ├── api/
│ │ │ └── hello.ts
│ │ ├── \_app.tsx # アプリケーションルート
│ │ ├── \_document.tsx # ドキュメント定義
│ │ ├── index.tsx # ホームページ
│ │ ├── login.tsx # ログインページ
│ │ └── signup.tsx # 新規登録ページ
│ ├── providers/ # プロバイダー
│ │ └── NotificationContext.tsx
│ └── styles/ # グローバルスタイル
│ └── globals.css
├── firestore.rules # Firestore セキュリティルール
├── tailwind.config.js # Tailwind CSS 設定
├── postcss.config.js # PostCSS 設定
├── next.config.js # Next.js 設定
├── tsconfig.json # TypeScript 設定
├── components.json # shadcn/ui 設定
├── cors.json # CORS 設定
├── .eslintrc.json # ESLint 設定
├── .eslintignore # ESLint 除外
├── .gitattributes
├── .gitignore
├── .clineignore
├── .clinerules
├── package.json # プロジェクト設定
├── README.md # プロジェクト概要
└── technologystack.md # 技術スタック定義

### 配置ルール

- **UI コンポーネント** → `src/components/ui/`
- **API エンドポイント** → `src/pages/api/`
- **共通処理** → `src/lib/utils/`
