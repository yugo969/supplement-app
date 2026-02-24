import { expect, test } from "@playwright/test";

/**
 * pre-commitで実行する安定版E2E smokeテスト。
 * 外部Authの成功可否に依存せず、主要導線の表示/遷移のみを検証する。
 */
test.describe("pre-commit smoke", () => {
  test("ログイン導線が表示され、新規登録ページへ遷移できる", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/.*login/);

    await expect(page.getByRole("heading", { name: "ログイン" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Email:" })).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: "Password:" })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "ログイン" })).toBeVisible();

    await page.getByRole("link", { name: "新規登録" }).click();
    await expect(page).toHaveURL(/.*signup/);
    await expect(
      page.getByRole("heading", { name: "アカウント作成" })
    ).toBeVisible();
  });
});
