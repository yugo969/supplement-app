import { test, expect } from "@playwright/test";
import { E2E_EMAIL, E2E_PASSWORD } from "../utils/auth-credentials";

/**
 * Phase 3.1: 重要機能回帰テスト - 服用記録と残り容量反映問題
 * 過去に発生した「服用記録時の残り容量が正常に反映されない問題」の再発防止テスト
 *
 * 【重要課題】
 * - タイミングベース：服用記録/取り消し時の残り容量正常反映
 * - 回数ベース：+/-ボタンでの残り容量と回数履歴の正確な更新
 * - ボタン状態：服用状況に応じた動的な表示変更
 */

test.describe("Phase 3.1: 服用記録と残り容量反映 回帰テスト", () => {
  test.beforeEach(async ({ page }) => {
    // テスト前にログイン
    await page.goto("/");
    await expect(page).toHaveURL(/.*login/);

    await page.getByRole("textbox", { name: "Email:" }).fill(E2E_EMAIL);
    await page.getByRole("textbox", { name: "Password:" }).fill(E2E_PASSWORD);
    await page.getByRole("button", { name: "ログイン" }).click();

    await expect(page).toHaveURL(/.*\//);
    await expect(
      page.getByRole("heading", { name: "サプリ KEEPER" })
    ).toBeVisible();
  });

  test.describe("タイミングベース服用記録の回帰テスト", () => {
    test("朝・夜の服用記録と取り消しで残り容量が正常に変動する", async ({
      page,
    }) => {
      // 時刻付きの一意名称で作成
      const uniqueName = `回帰テスト-タイミング-${Date.now()}`;

      await page.getByRole("button", { name: "サプリを追加" }).click();
      await page.getByRole("textbox", { name: "サプリ名" }).fill(uniqueName);
      await page
        .getByRole("textbox", { name: "サプリメント全体の内容量の数値" })
        .fill("30");

      // 朝・夜のタイミング設定（タイミングベースはデフォルト選択済み）
      await page.getByRole("checkbox", { name: "朝" }).check();
      await page.getByRole("checkbox", { name: "夜" }).check();
      await page.getByRole("button", { name: "登録" }).click();

      // 新規作成したサプリカードを特定（一意名称で確実に特定）
      const supplementCard = page.locator('[id^="supplement-card-"]').filter({
        hasText: uniqueName,
      });
      await expect(supplementCard).toBeVisible();

      // 初期状態確認：残り30錠、朝・夜とも「記録」状態
      await expect(supplementCard.getByText("残り:")).toBeVisible();
      // 残り容量の正確な特定：「残り:」直後の数値スパン要素を使用
      await expect(
        supplementCard
          .locator(".text-gray-800")
          .filter({ hasText: /^30$/ })
          .first()
      ).toBeVisible();

      const morningButton = supplementCard.getByRole("button", {
        name: /朝の服用を記録/,
      });
      const eveningButton = supplementCard.getByRole("button", {
        name: /夜の服用を記録/,
      });
      await expect(morningButton).toBeVisible();
      await expect(eveningButton).toBeVisible();

      // 朝の服用記録 → 残り容量29錠、朝ボタンが「取り消し」に変更
      await morningButton.click();
      await expect(
        supplementCard
          .locator(".text-gray-800")
          .filter({ hasText: /^29$/ })
          .first()
      ).toBeVisible(); // 重要：残り容量減少確認
      await expect(
        supplementCard.getByRole("button", { name: /朝の服用を取り消し/ })
      ).toBeVisible();
      await expect(
        supplementCard.getByRole("button", { name: /夜の服用を記録/ })
      ).toBeVisible(); // 夜は変更なし

      // 夜の服用記録 → 残り容量28錠、夜ボタンも「取り消し」に変更
      await supplementCard
        .getByRole("button", { name: /夜の服用を記録/ })
        .click();
      await expect(
        supplementCard
          .locator(".text-gray-800")
          .filter({ hasText: /^28$/ })
          .first()
      ).toBeVisible(); // 重要：さらに減少確認
      await expect(
        supplementCard.getByRole("button", { name: /朝の服用を取り消し/ })
      ).toBeVisible();
      await expect(
        supplementCard.getByRole("button", { name: /夜の服用を取り消し/ })
      ).toBeVisible();

      // 朝の服用取り消し → 残り容量29錠に復元、朝ボタンが「記録」に戻る
      await supplementCard
        .getByRole("button", { name: /朝の服用を取り消し/ })
        .click();
      await expect(
        supplementCard
          .locator(".text-gray-800")
          .filter({ hasText: /^29$/ })
          .first()
      ).toBeVisible(); // 重要：残り容量復元確認
      await expect(
        supplementCard.getByRole("button", { name: /朝の服用を記録/ })
      ).toBeVisible();
      await expect(
        supplementCard.getByRole("button", { name: /夜の服用を取り消し/ })
      ).toBeVisible(); // 夜は変更なし

      // 夜の服用取り消し → 残り容量30錠に完全復元
      await supplementCard
        .getByRole("button", { name: /夜の服用を取り消し/ })
        .click();
      await expect(
        supplementCard
          .locator(".text-gray-800")
          .filter({ hasText: /^30$/ })
          .first()
      ).toBeVisible(); // 重要：完全復元確認
      await expect(
        supplementCard.getByRole("button", { name: /朝の服用を記録/ })
      ).toBeVisible();
      await expect(
        supplementCard.getByRole("button", { name: /夜の服用を記録/ })
      ).toBeVisible();
    });
  });

  test.describe("回数ベース服用記録の回帰テスト", () => {
    test("+/-ボタンで服用回数と残り容量が正確に連動する", async ({ page }) => {
      // 時刻付きの一意名称で作成
      const uniqueName = `回帰テスト-回数-${Date.now()}`;

      await page.getByRole("button", { name: "サプリを追加" }).click();
      await page.getByRole("textbox", { name: "サプリ名" }).fill(uniqueName);
      await page
        .getByRole("textbox", { name: "サプリメント全体の内容量の数値" })
        .fill("20");

      // 回数ベースに変更
      await page
        .getByRole("radio", { name: "回数ベース（1日の服用回数）" })
        .click();
      await page.getByRole("textbox", { name: "1日の目標服用回数" }).fill("3");
      await page.getByRole("button", { name: "登録" }).click();

      // 新規作成したサプリカードを特定
      const supplementCard = page.locator('[id^="supplement-card-"]').filter({
        hasText: uniqueName,
      });
      await expect(supplementCard).toBeVisible();

      // 初期状態確認：残り20錠、目標0/3回、-ボタン無効
      await expect(supplementCard.getByText("残り:")).toBeVisible();
      await expect(
        supplementCard
          .locator(".text-gray-800")
          .filter({ hasText: /^20$/ })
          .first()
      ).toBeVisible();
      await expect(supplementCard.getByText("目標: 0 / 3 回")).toBeVisible();
      await expect(supplementCard.getByText("未服用")).toBeVisible();

      const decreaseButton = supplementCard.getByRole("button", {
        name: "服用回数を減らす",
      });
      const increaseButton = supplementCard.getByRole("button", {
        name: "服用回数を増やす",
      });
      await expect(decreaseButton).toBeDisabled();
      await expect(increaseButton).toBeEnabled();

      // +ボタンで1回目服用 → 残り19錠、目標1/3回、-ボタン有効化
      await increaseButton.click();
      await expect(
        supplementCard
          .locator(".text-gray-800")
          .filter({ hasText: /^19$/ })
          .first()
      ).toBeVisible(); // 重要：残り容量減少確認
      await expect(supplementCard.getByText("目標: 1 / 3 回")).toBeVisible();
      await expect(decreaseButton).toBeEnabled();
      await expect(increaseButton).toBeEnabled();

      // +ボタンで2回目服用 → 残り18錠、目標2/3回
      await increaseButton.click();
      await expect(
        supplementCard
          .locator(".text-gray-800")
          .filter({ hasText: /^18$/ })
          .first()
      ).toBeVisible(); // 重要：さらに減少確認
      await expect(supplementCard.getByText("目標: 2 / 3 回")).toBeVisible();

      // -ボタンで1回取り消し → 残り19錠に復元、目標1/3回
      await decreaseButton.click();
      await expect(
        supplementCard
          .locator(".text-gray-800")
          .filter({ hasText: /^19$/ })
          .first()
      ).toBeVisible(); // 重要：残り容量復元確認
      await expect(supplementCard.getByText("目標: 1 / 3 回")).toBeVisible();

      // -ボタンで完全取り消し → 残り20錠に完全復元、目標0/3回、-ボタン無効化
      await decreaseButton.click();
      await expect(
        supplementCard
          .locator(".text-gray-800")
          .filter({ hasText: /^20$/ })
          .first()
      ).toBeVisible(); // 重要：完全復元確認
      await expect(supplementCard.getByText("目標: 0 / 3 回")).toBeVisible();
      await expect(supplementCard.getByText("未服用")).toBeVisible();
      await expect(decreaseButton).toBeDisabled();
    });

    test("複数回連続服用でも残り容量が正確に計算される", async ({ page }) => {
      // 時刻付きの一意名称で作成
      const uniqueName = `回帰テスト-連続-${Date.now()}`;

      await page.getByRole("button", { name: "サプリを追加" }).click();
      await page.getByRole("textbox", { name: "サプリ名" }).fill(uniqueName);
      await page
        .getByRole("textbox", { name: "サプリメント全体の内容量の数値" })
        .fill("10");

      await page
        .getByRole("radio", { name: "回数ベース（1日の服用回数）" })
        .click();
      await page.getByRole("textbox", { name: "1日の目標服用回数" }).fill("5");
      await page.getByRole("button", { name: "登録" }).click();

      const supplementCard = page.locator('[id^="supplement-card-"]').filter({
        hasText: uniqueName,
      });
      await expect(supplementCard).toBeVisible();

      const increaseButton = supplementCard.getByRole("button", {
        name: "服用回数を増やす",
      });
      const decreaseButton = supplementCard.getByRole("button", {
        name: "服用回数を減らす",
      });

      // 5回連続で+ボタンクリック → 残り5錠、目標5/5回（完了状態）
      for (let i = 1; i <= 5; i++) {
        await increaseButton.click();
        const remaining = 10 - i;
        // 残り容量の正確な特定：「残り:」直後の数値スパン要素
        await expect(
          supplementCard
            .locator(".text-gray-800")
            .filter({ hasText: new RegExp(`^${remaining}$`) })
            .first()
        ).toBeVisible();
        await expect(
          supplementCard.getByText(`目標: ${i} / 5 回`)
        ).toBeVisible();
      }

      // 5回連続で-ボタンクリック → 残り10錠に完全復元、目標0/5回
      for (let i = 4; i >= 0; i--) {
        await decreaseButton.click();
        const remaining = 10 - i;
        // 残り容量の正確な特定：「残り:」直後の数値スパン要素
        await expect(
          supplementCard
            .locator(".text-gray-800")
            .filter({ hasText: new RegExp(`^${remaining}$`) })
            .first()
        ).toBeVisible();
        await expect(
          supplementCard.getByText(`目標: ${i} / 5 回`)
        ).toBeVisible();
      }

      // 最終確認：完全初期状態に戻る
      await expect(
        supplementCard
          .locator(".text-gray-800")
          .filter({ hasText: /^10$/ })
          .first()
      ).toBeVisible();
      await expect(supplementCard.getByText("目標: 0 / 5 回")).toBeVisible();
      await expect(supplementCard.getByText("未服用")).toBeVisible();
      await expect(decreaseButton).toBeDisabled();
    });
  });

  test.describe("混在環境での一貫性テスト", () => {
    test("タイミングベースと回数ベースが同時存在しても各々正常動作する", async ({
      page,
    }) => {
      const timingName = `混在-タイミング-${Date.now()}`;
      const countName = `混在-回数-${Date.now()}`;

      // タイミングベースサプリ追加
      await page.getByRole("button", { name: "サプリを追加" }).click();
      await page.getByRole("textbox", { name: "サプリ名" }).fill(timingName);
      await page
        .getByRole("textbox", { name: "サプリメント全体の内容量の数値" })
        .fill("15");
      await page.getByRole("checkbox", { name: "朝" }).check();
      await page.getByRole("button", { name: "登録" }).click();

      // 回数ベースサプリ追加
      await page.getByRole("button", { name: "サプリを追加" }).click();
      await page.getByRole("textbox", { name: "サプリ名" }).fill(countName);
      await page
        .getByRole("textbox", { name: "サプリメント全体の内容量の数値" })
        .fill("12");
      await page
        .getByRole("radio", { name: "回数ベース（1日の服用回数）" })
        .click();
      await page.getByRole("textbox", { name: "1日の目標服用回数" }).fill("2");
      await page.getByRole("button", { name: "登録" }).click();

      const timingCard = page.locator('[id^="supplement-card-"]').filter({
        hasText: timingName,
      });
      const countCard = page.locator('[id^="supplement-card-"]').filter({
        hasText: countName,
      });

      await expect(timingCard).toBeVisible();
      await expect(countCard).toBeVisible();

      // タイミングベース：朝の服用記録 → 15錠→14錠
      await timingCard.getByRole("button", { name: /朝の服用を記録/ }).click();
      await expect(
        timingCard.locator(".text-gray-800").filter({ hasText: /^14$/ }).first()
      ).toBeVisible();

      // 回数ベース：1回服用記録 → 12錠→11錠
      await countCard.getByRole("button", { name: "服用回数を増やす" }).click();
      await expect(
        countCard.locator(".text-gray-800").filter({ hasText: /^11$/ }).first()
      ).toBeVisible();
      await expect(countCard.getByText("目標: 1 / 2 回")).toBeVisible();

      // 相互独立性確認：タイミングベースは変化なし
      await expect(
        timingCard.locator(".text-gray-800").filter({ hasText: /^14$/ }).first()
      ).toBeVisible();
      await expect(
        timingCard.getByRole("button", { name: /朝の服用を取り消し/ })
      ).toBeVisible();

      // 相互独立性確認：回数ベースも独立動作
      await expect(
        countCard.locator(".text-gray-800").filter({ hasText: /^11$/ }).first()
      ).toBeVisible();
      await expect(countCard.getByText("目標: 1 / 2 回")).toBeVisible();

      // 両方とも取り消し → 各々初期状態に復元
      await timingCard
        .getByRole("button", { name: /朝の服用を取り消し/ })
        .click();
      await expect(
        timingCard.locator(".text-gray-800").filter({ hasText: /^15$/ }).first()
      ).toBeVisible(); // 完全復元

      await countCard.getByRole("button", { name: "服用回数を減らす" }).click();
      await expect(
        countCard.locator(".text-gray-800").filter({ hasText: /^12$/ }).first()
      ).toBeVisible(); // 完全復元
      await expect(countCard.getByText("目標: 0 / 2 回")).toBeVisible();
    });
  });
});
