import { test, expect } from "@playwright/test";

/**
 * Hello World テスト
 * Playwright環境の動作確認用
 */

test.describe("Hello World - 環境動作確認", () => {
  test("アプリケーションが正常に読み込まれる", async ({ page }) => {
    // Next.jsアプリケーションにアクセス
    await page.goto("/");

    // ページが正常に表示されることを確認
    await expect(page.locator("body")).toBeVisible();

    // Next.jsのroot要素が存在することを確認
    await expect(page.locator("#__next")).toBeVisible();

    console.log("✅ Hello World テスト成功: アプリケーションが正常に動作中");
  });

  test("基本的な要素が存在する", async ({ page }) => {
    await page.goto("/");

    // 基本的なHTMLエレメントの存在確認
    await expect(page.locator("html")).toBeVisible();
    await expect(page.locator("head")).toBeAttached();

    console.log("✅ 基本的なDOM構造が正常");
  });

  test("Playwright設定が正しく動作する", async ({ page, browserName }) => {
    await page.goto("/");

    // ブラウザ名を確認
    console.log(`🌐 テスト実行ブラウザ: ${browserName}`);

    // スクリーンショットが取得できることを確認
    await page.screenshot({
      path: `test-results/hello-world-${browserName}.png`,
    });

    console.log("✅ Playwright設定が正常に動作中");
  });
});
