import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E テスト設定
 * サプリメント管理アプリ用の包括的テスト環境
 */
export default defineConfig({
  // テストディレクトリ
  testDir: "./tests/e2e",

  // 並列実行設定
  fullyParallel: true,

  // CI環境でのfail-fast設定
  forbidOnly: !!process.env.CI,

  // CI環境でのリトライ設定
  retries: process.env.CI ? 2 : 0,

  // 並列ワーカー数
  workers: process.env.CI ? 1 : undefined,

  // レポート設定
  reporter: [
    ["html", { outputFolder: "test-results/html-report" }],
    ["json", { outputFile: "test-results/results.json" }],
    ["line"],
  ],

  // 全テスト共通設定
  use: {
    // ベースURL（開発サーバー）
    baseURL: "http://localhost:3000",

    // スクリーンショット設定
    screenshot: "only-on-failure",

    // 動画録画設定
    video: "retain-on-failure",

    // トレース設定（デバッグ用）
    trace: "on-first-retry",

    // ブラウザコンテキスト設定
    viewport: { width: 1280, height: 720 },

    // タイムアウト設定
    actionTimeout: 30000,
    navigationTimeout: 30000,
  },

  // プロジェクト設定（複数ブラウザ対応）
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },

    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },

    // モバイルテスト
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },

    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
    },
  ],

  // 開発サーバー設定
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  // 出力ディレクトリ
  outputDir: "test-results/artifacts",

  // グローバルタイムアウト
  globalTimeout: 600000, // 10分

  // テストタイムアウト
  timeout: 30000,

  // 期待値タイムアウト
  expect: {
    timeout: 10000,
  },
});
