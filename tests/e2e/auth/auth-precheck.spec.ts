import { expect, test } from "@playwright/test";
import { E2E_EMAIL, E2E_PASSWORD } from "../utils/auth-credentials";

test("auth precheck: test account can log in", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/.*login/);

  await page.getByRole("textbox", { name: "Email:" }).fill(E2E_EMAIL);
  await page.getByRole("textbox", { name: "Password:" }).fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "ログイン" }).click();

  await expect(page).toHaveURL(/.*\/$/, { timeout: 15000 });
  await expect(
    page.getByRole("heading", { name: "サプリ KEEPER" })
  ).toBeVisible();
});
