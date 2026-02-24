import { defineConfig, devices } from "@playwright/test";
import { spawnSync } from "node:child_process";

const candidatePorts = (process.env.E2E_PORT_CANDIDATES ?? "3000,3001,3002")
  .split(",")
  .map((port) => port.trim())
  .filter(Boolean);

const isServerHealthy = (port: string): boolean => {
  const result = spawnSync(
    "curl",
    ["-sf", "--max-time", "2", `http://localhost:${port}/login`],
    { stdio: "ignore" }
  );
  return result.status === 0;
};

const isPortInUse = (port: string): boolean => {
  const script = `
import socket
import sys

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
try:
    sock.bind(("127.0.0.1", int(sys.argv[1])))
    sock.close()
    sys.exit(1)
except OSError:
    sock.close()
    sys.exit(0)
  `;
  const result = spawnSync("python3", ["-c", script, port], {
    stdio: "ignore",
  });
  return result.status === 0;
};

const pickFirstFreePort = (ports: string[]): string | null => {
  const script = `
import socket
import sys

for port in sys.argv[1:]:
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        sock.bind(("127.0.0.1", int(port)))
        sock.close()
        print(port, end="")
        break
    except OSError:
        sock.close()
  `;

  const result = spawnSync("python3", ["-c", script, ...ports], {
    encoding: "utf8",
  });
  const port = (result.stdout ?? "").trim();
  return port.length > 0 ? port : null;
};

const pickPort = (): string => {
  if (process.env.E2E_PORT) {
    return process.env.E2E_PORT;
  }

  for (const port of candidatePorts) {
    if (isServerHealthy(port)) {
      return port;
    }
  }

  for (const port of candidatePorts) {
    if (isPortInUse(port)) {
      return port;
    }
  }

  const candidateFree = pickFirstFreePort(candidatePorts);
  if (candidateFree) {
    return candidateFree;
  }

  const extendedPorts = Array.from({ length: 1000 }, (_, index) =>
    String(3000 + index)
  );
  const extendedFree = pickFirstFreePort(extendedPorts);
  if (extendedFree) {
    return extendedFree;
  }

  return candidatePorts[0] ?? "3000";
};

const e2ePort = pickPort();
const e2eBaseUrl =
  process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${e2ePort}`;

/**
 * Playwright E2E テスト設定
 * サプリメント管理アプリ用の包括的テスト環境
 */
export default defineConfig({
  // テストディレクトリ
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",

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
    baseURL: e2eBaseUrl,

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
    command: `npx next dev -p ${e2ePort}`,
    url: e2eBaseUrl,
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
