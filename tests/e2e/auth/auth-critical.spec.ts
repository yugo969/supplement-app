import { expect, test } from "@playwright/test";
import { E2E_EMAIL, E2E_PASSWORD } from "../utils/auth-credentials";

test.describe("認証機能（critical）", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/.*login/);
  });

  test("正しい認証情報でのログインが成功する", async ({ page }) => {
    await page.getByRole("textbox", { name: "Email:" }).fill(E2E_EMAIL);
    await page.getByRole("textbox", { name: "Password:" }).fill(E2E_PASSWORD);
    await page.getByRole("button", { name: "ログイン" }).click();

    await expect(page).toHaveURL(/.*\/$/, { timeout: 15000 });
    await expect(
      page.getByRole("heading", { name: "サプリ KEEPER" })
    ).toBeVisible();
  });

  test("ログアウト後に認証ページにリダイレクトされる", async ({ page }) => {
    await page.getByRole("textbox", { name: "Email:" }).fill(E2E_EMAIL);
    await page.getByRole("textbox", { name: "Password:" }).fill(E2E_PASSWORD);
    await page.getByRole("button", { name: "ログイン" }).click();

    await expect(page).toHaveURL(/.*\/$/, { timeout: 15000 });
    await page.getByRole("button", { name: "ログアウト" }).click();
    await expect(page).toHaveURL(/.*login/, { timeout: 15000 });
  });
});
