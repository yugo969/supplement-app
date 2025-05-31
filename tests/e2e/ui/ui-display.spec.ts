import { test, expect } from "@playwright/test";

/**
 * Phase 3.3: UI表示の正確性テスト
 * 推奨服用方法表示やタイミングボタンの選択的表示など、UI要素の正確な表示をテストする
 *
 * 【テスト対象】
 * - 推奨服用方法の表示/非表示
 * - タイミングボタンの選択的表示
 * - アイコンとラベルの正確性
 */

test.describe("Phase 3.3: UI表示の正確性テスト", () => {
  test.beforeEach(async ({ page }) => {
    // テスト前にログイン
    await page.goto("/");
    await expect(page).toHaveURL(/.*login/);

    await page
      .getByRole("textbox", { name: "Email:" })
      .fill("test-e2e@example.com");
    await page
      .getByRole("textbox", { name: "Password:" })
      .fill("TestPassword123!");
    await page.getByRole("button", { name: "ログイン" }).click();

    await expect(page).toHaveURL(/.*\//);
    await expect(
      page.getByRole("heading", { name: "サプリ KEEPER" })
    ).toBeVisible();
  });

  test.describe("推奨服用方法表示テスト", () => {
    test("食前推奨設定時に推奨服用方法が表示される", async ({ page }) => {
      const uniqueName = `UI表示テスト-食前-${Date.now()}`;

      await page.getByRole("button", { name: "サプリを追加" }).click();
      await page.getByRole("textbox", { name: "サプリ名" }).fill(uniqueName);
      await page
        .getByRole("textbox", { name: "サプリメント全体の内容量の数値" })
        .fill("30");

      // 朝のタイミング設定
      await page.getByRole("checkbox", { name: "朝" }).check();

      // 推奨服用方法を食前に設定
      await page.getByRole("radio", { name: "食前" }).click();
      await page.getByRole("button", { name: "登録" }).click();

      // 新規作成したサプリカードを特定
      const supplementCard = page.locator('[id^="supplement-card-"]').filter({
        hasText: uniqueName,
      });
      await expect(supplementCard).toBeVisible();

      // 推奨服用方法の表示を確認
      const recommendedInfo = supplementCard
        .locator('[class*="text-gray-500"]')
        .filter({
          hasText: "服用方法",
        });
      await expect(recommendedInfo).toBeVisible();

      // 「服用方法」ボタンをクリックして展開
      await recommendedInfo.click();

      // 食前のアイコンとラベルが表示されることを確認 - 精密セレクター使用
      await expect(
        supplementCard
          .locator("span.text-xs")
          .filter({ hasText: /^食前$/ })
          .first()
      ).toBeVisible();
    });

    test("食後推奨設定時に食後のアイコンとラベルが表示される", async ({
      page,
    }) => {
      const uniqueName = `UI表示テスト-食後-${Date.now()}`;

      await page.getByRole("button", { name: "サプリを追加" }).click();
      await page.getByRole("textbox", { name: "サプリ名" }).fill(uniqueName);
      await page
        .getByRole("textbox", { name: "サプリメント全体の内容量の数値" })
        .fill("25");

      // 昼のタイミング設定
      await page.getByRole("checkbox", { name: "昼" }).check();

      // 推奨服用方法を食後に設定
      await page.getByRole("radio", { name: "食後" }).click();
      await page.getByRole("button", { name: "登録" }).click();

      const supplementCard = page.locator('[id^="supplement-card-"]').filter({
        hasText: uniqueName,
      });
      await expect(supplementCard).toBeVisible();

      // 推奨服用方法の表示を確認し、展開
      const recommendedInfo = supplementCard
        .locator('[class*="text-gray-500"]')
        .filter({
          hasText: "服用方法",
        });
      await expect(recommendedInfo).toBeVisible();
      await recommendedInfo.click();

      // 食後のラベルが表示されることを確認 - 精密セレクター使用
      await expect(
        supplementCard
          .locator("span.text-xs")
          .filter({ hasText: /^食後$/ })
          .first()
      ).toBeVisible();
    });

    test("推奨服用方法未設定時は服用方法セクションが非表示", async ({
      page,
    }) => {
      const uniqueName = `UI表示テスト-未設定-${Date.now()}`;

      await page.getByRole("button", { name: "サプリを追加" }).click();
      await page.getByRole("textbox", { name: "サプリ名" }).fill(uniqueName);
      await page
        .getByRole("textbox", { name: "サプリメント全体の内容量の数値" })
        .fill("20");

      // 朝のタイミング設定のみ（推奨服用方法は「なし」のまま）
      await page.getByRole("checkbox", { name: "朝" }).check();
      await page.getByRole("button", { name: "登録" }).click();

      const supplementCard = page.locator('[id^="supplement-card-"]').filter({
        hasText: uniqueName,
      });
      await expect(supplementCard).toBeVisible();

      // 推奨服用方法セクションが表示されないことを確認
      const recommendedInfo = supplementCard
        .locator('[class*="text-gray-500"]')
        .filter({
          hasText: "服用方法",
        });
      await expect(recommendedInfo).not.toBeVisible();
    });
  });

  test.describe("タイミングボタン選択的表示テスト", () => {
    test("朝のみ設定時は朝ボタンのみ表示される", async ({ page }) => {
      const uniqueName = `UI表示テスト-朝のみ-${Date.now()}`;

      await page.getByRole("button", { name: "サプリを追加" }).click();
      await page.getByRole("textbox", { name: "サプリ名" }).fill(uniqueName);
      await page
        .getByRole("textbox", { name: "サプリメント全体の内容量の数値" })
        .fill("15");

      // 朝のタイミングのみ設定
      await page.getByRole("checkbox", { name: "朝" }).check();
      await page.getByRole("button", { name: "登録" }).click();

      const supplementCard = page.locator('[id^="supplement-card-"]').filter({
        hasText: uniqueName,
      });
      await expect(supplementCard).toBeVisible();

      // 朝ボタンが表示されることを確認
      await expect(
        supplementCard.getByRole("button", { name: /朝の服用を記録/ })
      ).toBeVisible();

      // 昼・夜ボタンが表示されないことを確認
      const noonButton = supplementCard.getByRole("button", {
        name: /昼の服用を/,
      });
      const eveningButton = supplementCard.getByRole("button", {
        name: /夜の服用を/,
      });

      // カウントが0であることを確認（存在しない）
      await expect(noonButton).toHaveCount(0);
      await expect(eveningButton).toHaveCount(0);
    });

    test("朝・夜設定時は朝・夜ボタンのみ表示される", async ({ page }) => {
      const uniqueName = `UI表示テスト-朝夜-${Date.now()}`;

      await page.getByRole("button", { name: "サプリを追加" }).click();
      await page.getByRole("textbox", { name: "サプリ名" }).fill(uniqueName);
      await page
        .getByRole("textbox", { name: "サプリメント全体の内容量の数値" })
        .fill("18");

      // 朝・夜のタイミング設定
      await page.getByRole("checkbox", { name: "朝" }).check();
      await page.getByRole("checkbox", { name: "夜" }).check();
      await page.getByRole("button", { name: "登録" }).click();

      const supplementCard = page.locator('[id^="supplement-card-"]').filter({
        hasText: uniqueName,
      });
      await expect(supplementCard).toBeVisible();

      // 朝・夜ボタンが表示されることを確認
      await expect(
        supplementCard.getByRole("button", { name: /朝の服用を記録/ })
      ).toBeVisible();
      await expect(
        supplementCard.getByRole("button", { name: /夜の服用を記録/ })
      ).toBeVisible();

      // 昼ボタンが表示されないことを確認
      const noonButton = supplementCard.getByRole("button", {
        name: /昼の服用を/,
      });
      await expect(noonButton).toHaveCount(0);
    });

    test("朝・昼・夜すべて設定時はすべてのボタンが表示される", async ({
      page,
    }) => {
      const uniqueName = `UI表示テスト-全タイミング-${Date.now()}`;

      await page.getByRole("button", { name: "サプリを追加" }).click();
      await page.getByRole("textbox", { name: "サプリ名" }).fill(uniqueName);
      await page
        .getByRole("textbox", { name: "サプリメント全体の内容量の数値" })
        .fill("22");

      // すべてのタイミング設定
      await page.getByRole("checkbox", { name: "朝" }).check();
      await page.getByRole("checkbox", { name: "昼" }).check();
      await page.getByRole("checkbox", { name: "夜" }).check();
      await page.getByRole("button", { name: "登録" }).click();

      const supplementCard = page.locator('[id^="supplement-card-"]').filter({
        hasText: uniqueName,
      });
      await expect(supplementCard).toBeVisible();

      // すべてのボタンが表示されることを確認
      await expect(
        supplementCard.getByRole("button", { name: /朝の服用を記録/ })
      ).toBeVisible();
      await expect(
        supplementCard.getByRole("button", { name: /昼の服用を記録/ })
      ).toBeVisible();
      await expect(
        supplementCard.getByRole("button", { name: /夜の服用を記録/ })
      ).toBeVisible();
    });
  });

  test.describe("回数ベースUI表示テスト", () => {
    test("回数ベース設定時は+/-ボタンと目標カウンターが表示される", async ({
      page,
    }) => {
      const uniqueName = `UI表示テスト-回数ベース-${Date.now()}`;

      await page.getByRole("button", { name: "サプリを追加" }).click();
      await page.getByRole("textbox", { name: "サプリ名" }).fill(uniqueName);
      await page
        .getByRole("textbox", { name: "サプリメント全体の内容量の数値" })
        .fill("24");

      // 回数ベースに変更
      await page
        .getByRole("radio", { name: "回数ベース（1日の服用回数）" })
        .click();
      await page.getByRole("textbox", { name: "1日の目標服用回数" }).fill("3");
      await page.getByRole("button", { name: "登録" }).click();

      const supplementCard = page.locator('[id^="supplement-card-"]').filter({
        hasText: uniqueName,
      });
      await expect(supplementCard).toBeVisible();

      // +/-ボタンが表示されることを確認
      await expect(
        supplementCard.getByRole("button", { name: "服用回数を増やす" })
      ).toBeVisible();
      await expect(
        supplementCard.getByRole("button", { name: "服用回数を減らす" })
      ).toBeVisible();

      // 目標カウンターが表示されることを確認
      await expect(supplementCard.getByText("目標: 0 / 3 回")).toBeVisible();
      await expect(supplementCard.getByText("未服用")).toBeVisible();

      // タイミングボタンが表示されないことを確認
      const timingButtons = supplementCard.getByRole("button", {
        name: /の服用を/,
      });
      await expect(timingButtons).toHaveCount(0);
    });

    test("回数ベースで推奨服用方法設定時も正常に表示される", async ({
      page,
    }) => {
      const uniqueName = `UI表示テスト-回数+推奨-${Date.now()}`;

      await page.getByRole("button", { name: "サプリを追加" }).click();
      await page.getByRole("textbox", { name: "サプリ名" }).fill(uniqueName);
      await page
        .getByRole("textbox", { name: "サプリメント全体の内容量の数値" })
        .fill("30");

      // 回数ベースに変更
      await page
        .getByRole("radio", { name: "回数ベース（1日の服用回数）" })
        .click();
      await page.getByRole("textbox", { name: "1日の目標服用回数" }).fill("2");

      // 推奨服用方法を就寝前に設定
      await page.getByRole("checkbox", { name: "就寝前" }).check();
      await page.getByRole("button", { name: "登録" }).click();

      const supplementCard = page.locator('[id^="supplement-card-"]').filter({
        hasText: uniqueName,
      });
      await expect(supplementCard).toBeVisible();

      // 回数ベースUI要素の確認
      await expect(
        supplementCard.getByRole("button", { name: "服用回数を増やす" })
      ).toBeVisible();
      await expect(supplementCard.getByText("目標: 0 / 2 回")).toBeVisible();

      // 推奨服用方法の表示確認
      const recommendedInfo = supplementCard
        .locator('[class*="text-gray-500"]')
        .filter({
          hasText: "服用方法",
        });
      await expect(recommendedInfo).toBeVisible();
      await recommendedInfo.click();

      // 就寝前のラベルが表示されることを確認 - 精密セレクター使用
      await expect(
        supplementCard
          .locator("span.text-xs")
          .filter({ hasText: /^就寝前$/ })
          .first()
      ).toBeVisible();
    });
  });

  test.describe("混在環境でのUI表示一貫性テスト", () => {
    test("タイミングベースと回数ベースが同時存在してもUI表示は独立している", async ({
      page,
    }) => {
      const timingName = `UI混在-タイミング-${Date.now()}`;
      const countName = `UI混在-回数-${Date.now()}`;

      // タイミングベースサプリ追加
      await page.getByRole("button", { name: "サプリを追加" }).click();
      await page.getByRole("textbox", { name: "サプリ名" }).fill(timingName);
      await page
        .getByRole("textbox", { name: "サプリメント全体の内容量の数値" })
        .fill("20");
      await page.getByRole("checkbox", { name: "朝" }).check();
      await page.getByRole("checkbox", { name: "夜" }).check();
      await page.getByRole("radio", { name: "食前" }).click();
      await page.getByRole("button", { name: "登録" }).click();

      // 回数ベースサプリ追加
      await page.getByRole("button", { name: "サプリを追加" }).click();
      await page.getByRole("textbox", { name: "サプリ名" }).fill(countName);
      await page
        .getByRole("textbox", { name: "サプリメント全体の内容量の数値" })
        .fill("18");
      await page
        .getByRole("radio", { name: "回数ベース（1日の服用回数）" })
        .click();
      await page.getByRole("textbox", { name: "1日の目標服用回数" }).fill("4");
      await page.getByRole("radio", { name: "食後" }).click();
      await page.getByRole("button", { name: "登録" }).click();

      const timingCard = page.locator('[id^="supplement-card-"]').filter({
        hasText: timingName,
      });
      const countCard = page.locator('[id^="supplement-card-"]').filter({
        hasText: countName,
      });

      await expect(timingCard).toBeVisible();
      await expect(countCard).toBeVisible();

      // タイミングベースカードのUI確認
      await expect(
        timingCard.getByRole("button", { name: /朝の服用を記録/ })
      ).toBeVisible();
      await expect(
        timingCard.getByRole("button", { name: /夜の服用を記録/ })
      ).toBeVisible();

      // タイミングベースの推奨服用方法確認
      const timingRecommended = timingCard
        .locator('[class*="text-gray-500"]')
        .filter({
          hasText: "服用方法",
        });
      await expect(timingRecommended).toBeVisible();

      // 回数ベースカードのUI確認
      await expect(
        countCard.getByRole("button", { name: "服用回数を増やす" })
      ).toBeVisible();
      await expect(countCard.getByText("目標: 0 / 4 回")).toBeVisible();

      // 回数ベースの推奨服用方法確認
      const countRecommended = countCard
        .locator('[class*="text-gray-500"]')
        .filter({
          hasText: "服用方法",
        });
      await expect(countRecommended).toBeVisible();

      // 各カードで異なる推奨服用方法が設定されていることを確認 - 精密セレクター使用
      await timingRecommended.click();
      await expect(
        timingCard
          .locator("span.text-xs")
          .filter({ hasText: /^食前$/ })
          .first()
      ).toBeVisible();

      await countRecommended.click();
      await expect(
        countCard
          .locator("span.text-xs")
          .filter({ hasText: /^食後$/ })
          .first()
      ).toBeVisible();

      // 相互干渉がないことを確認 - より確実な検証
      const timingFoodAfter = timingCard
        .locator("span.text-xs")
        .filter({ hasText: /^食後$/ });
      const countFoodBefore = countCard
        .locator("span.text-xs")
        .filter({ hasText: /^食前$/ });

      await expect(timingFoodAfter).toHaveCount(0);
      await expect(countFoodBefore).toHaveCount(0);
    });
  });
});
