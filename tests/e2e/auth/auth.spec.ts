import { test, expect } from "@playwright/test";

/**
 * 認証機能 E2Eテスト
 * 実際のブラウザ操作で検証済みの認証フローをテスト化
 */

test.describe("認証機能", () => {
  test.beforeEach(async ({ page }) => {
    // テスト前にアプリにアクセス
    await page.goto("/");
  });

  test.describe("新規登録機能", () => {
    test("有効な情報での新規登録が成功する", async ({ page }) => {
      // ログインページにリダイレクトされることを確認
      await expect(page).toHaveURL(/.*login/);

      // 新規登録リンクをクリック
      await page.getByRole("link", { name: "新規登録" }).click();

      // 新規登録ページに遷移することを確認
      await expect(page).toHaveURL(/.*signup/);
      await expect(
        page.getByRole("heading", { name: "アカウント作成" })
      ).toBeVisible();

      // テスト用のユニークなメールアドレスを生成
      const testEmail = `test-${Date.now()}@example.com`;
      const testPassword = "TestPassword123!";

      // フォーム入力
      await page
        .getByRole("textbox", { name: "メールアドレス:" })
        .fill(testEmail);
      await page
        .getByRole("textbox", { name: "パスワード:" })
        .fill(testPassword);

      // アカウント作成ボタンをクリック
      await page.getByRole("button", { name: "アカウントを作成" }).click();

      // 成功後のリダイレクトと通知確認
      await expect(page).toHaveURL(/.*\/$/, { timeout: 10000 });

      // メインページの要素が表示されることを確認
      await expect(
        page.getByRole("heading", { name: "サプリ KEEPER" })
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "サプリを追加" })
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "ログアウト" })
      ).toBeVisible();

      // 成功通知の確認（アラート要素）
      await expect(page.locator('[role="alert"]')).toBeVisible();

      console.log(`✅ 新規登録成功: ${testEmail}`);
    });

    test("無効なメールアドレスでの新規登録が失敗する", async ({ page }) => {
      await expect(page).toHaveURL(/.*login/);

      await page.getByRole("link", { name: "新規登録" }).click();
      await expect(page).toHaveURL(/.*signup/);

      // 無効なメールアドレスを入力
      await page
        .getByRole("textbox", { name: "メールアドレス:" })
        .fill("invalid-email");
      await page
        .getByRole("textbox", { name: "パスワード:" })
        .fill("TestPassword123!");

      // フォーム送信
      await page.getByRole("button", { name: "アカウントを作成" }).click();

      // エラー状態の確認（ページが変わらず、エラーメッセージ表示）
      await expect(page).toHaveURL(/.*signup/);

      // バリデーションエラーまたはエラーメッセージの存在確認
      // (実際のエラー表示方法に応じて調整が必要)

      console.log("✅ 無効メールアドレスでの登録失敗を確認");
    });
  });

  test.describe("ログイン機能", () => {
    test("正しい認証情報でのログインが成功する", async ({ page }) => {
      // 事前に作成済みのテストアカウントでログインテスト
      await expect(page).toHaveURL(/.*login/);

      // ログインフォームの存在確認
      await expect(
        page.getByRole("heading", { name: "ログイン" })
      ).toBeVisible();

      // 認証情報入力（実際のテストアカウント使用）
      await page
        .getByRole("textbox", { name: "Email:" })
        .fill("test-e2e@example.com");
      await page
        .getByRole("textbox", { name: "Password:" })
        .fill("TestPassword123!");

      // ログインボタンクリック
      await page.getByRole("button", { name: "ログイン" }).click();

      // ログイン成功の確認
      await expect(page).toHaveURL(/.*\/$/, { timeout: 10000 });
      await expect(
        page.getByRole("heading", { name: "サプリ KEEPER" })
      ).toBeVisible();

      console.log("✅ ログイン成功確認");
    });

    test("間違った認証情報でのログインが失敗する", async ({ page }) => {
      await expect(page).toHaveURL(/.*login/);

      // 間違った認証情報を入力
      await page
        .getByRole("textbox", { name: "Email:" })
        .fill("wrong@example.com");
      await page
        .getByRole("textbox", { name: "Password:" })
        .fill("wrongpassword");

      // ログインボタンクリック
      await page.getByRole("button", { name: "ログイン" }).click();

      // ログイン失敗の確認（ログインページに留まる）
      await expect(page).toHaveURL(/.*login/);

      console.log("✅ 間違った認証情報でのログイン失敗を確認");
    });
  });

  test.describe("ログアウト機能", () => {
    test("ログアウト後に認証ページにリダイレクトされる", async ({ page }) => {
      // まず有効な認証情報でログイン
      await expect(page).toHaveURL(/.*login/);

      await page
        .getByRole("textbox", { name: "Email:" })
        .fill("test-e2e@example.com");
      await page
        .getByRole("textbox", { name: "Password:" })
        .fill("TestPassword123!");
      await page.getByRole("button", { name: "ログイン" }).click();

      // ログイン成功を確認
      await expect(page).toHaveURL(/.*\/$/);
      await expect(
        page.getByRole("button", { name: "ログアウト" })
      ).toBeVisible();

      // ログアウトボタンをクリック
      await page.getByRole("button", { name: "ログアウト" }).click();

      // ログアウト後の確認
      await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
      await expect(
        page.getByRole("heading", { name: "ログイン" })
      ).toBeVisible();

      console.log("✅ ログアウト後のリダイレクト確認");
    });
  });
});
