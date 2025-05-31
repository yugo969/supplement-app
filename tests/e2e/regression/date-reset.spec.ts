import { test, expect } from "@playwright/test";

/**
 * Phase 3.2: 日付変更時リセット機能の回帰テスト
 *
 * 重要機能：毎日の服用記録が日付変更時に正しくリセットされることを確認
 * - タイミングベース：朝・夜ボタンが全て「記録」状態にリセット
 * - 回数ベース：服用回数が0にリセット
 * - 残り容量は変更されないことを確認
 */
test.describe("日付変更時リセット機能テスト", () => {
  test.beforeEach(async ({ page }) => {
    // アプリケーションのベースURLにアクセス
    await page.goto("/");

    // ページがロードされるのを少し待つ
    await page.waitForLoadState("domcontentloaded");

    // ログインページが表示されるまで待機 (H1見出し「ログイン」を確認)
    await expect(page.locator("h1", { hasText: "ログイン" })).toBeVisible({
      timeout: 15000,
    });

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.getByRole("button", { name: "ログイン" });

    // フォーム要素が表示され、操作可能になるまで待機
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toBeEnabled();
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toBeEnabled();
    await expect(loginButton).toBeVisible();
    await expect(loginButton).toBeEnabled();

    // ログイン情報を入力
    await emailInput.fill("test-e2e@example.com");
    await passwordInput.fill("TestPassword123!");

    // ログインボタンをクリック
    await loginButton.click();

    // ログイン後のメインページが表示されるまで待機（サプリメント一覧エリア）
    await expect(
      page.getByRole("region", { name: "サプリメント一覧" })
    ).toBeVisible({
      timeout: 15000,
    });
  });

  test("複数タイミングサプリの日付変更リセットテスト", async ({ page }) => {
    // テスト対象：複数タイミングテスト-1748647504232（現在服用済み状態）
    const multiTimingCard = page.locator("div").filter({
      hasText: /^no-image複数タイミングテスト-1748647504232残り:27錠/,
    });

    // 現在の状態確認：すべて「取り消し」状態（服用済み）
    await expect(
      multiTimingCard.getByRole("button", { name: /朝の服用を取り消し/ })
    ).toBeVisible({ timeout: 10000 });
    await expect(
      multiTimingCard.getByRole("button", { name: /昼の服用を取り消し/ })
    ).toBeVisible();
    await expect(
      multiTimingCard.getByRole("button", { name: /夜の服用を取り消し/ })
    ).toBeVisible();

    // 残り容量を記録（27錠）
    await expect(multiTimingCard.locator("text=27")).toBeVisible();

    // JavaScriptのDateオブジェクトをモックして翌日にする
    await page.addInitScript(() => {
      const currentTime = new Date();
      const tomorrow = new Date(currentTime);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Dateコンストラクタを完全にオーバーライド
      const OriginalDate = Date;
      // @ts-ignore
      Date = class extends OriginalDate {
        constructor(...args: any[]) {
          if (args.length === 0) {
            super(tomorrow.getTime());
          } else {
            super(
              args[0],
              args[1],
              args[2],
              args[3],
              args[4],
              args[5],
              args[6]
            );
          }
        }

        static now() {
          return tomorrow.getTime();
        }
      };

      // Date.now()も翌日を返すようにする
      Object.setPrototypeOf(Date, OriginalDate);
      Object.defineProperty(Date, "prototype", {
        value: OriginalDate.prototype,
        writable: false,
      });
    });

    // ページをリロードして日付変更を反映
    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    // サプリメント一覧が再表示されるまで待機
    await expect(
      page.getByRole("region", { name: "サプリメント一覧" })
    ).toBeVisible({
      timeout: 15000,
    });

    // 日付チェックインターバル（1分間隔）が動作するまで少し待機
    await page.waitForTimeout(70000); // 70秒待機でインターバルを確実に実行

    // リセット後の状態確認：すべて「記録」状態にリセット
    await expect(
      multiTimingCard.getByRole("button", { name: /朝の服用を記録/ })
    ).toBeVisible({ timeout: 15000 });
    await expect(
      multiTimingCard.getByRole("button", { name: /昼の服用を記録/ })
    ).toBeVisible();
    await expect(
      multiTimingCard.getByRole("button", { name: /夜の服用を記録/ })
    ).toBeVisible();

    // 残り容量は変更されないことを確認（27錠のまま）
    await expect(multiTimingCard.locator("text=27")).toBeVisible();
  });

  test.skip("回数ベースサプリの日付変更リセットテスト", async ({ page }) => {
    // テスト対象：回帰テスト 回数ベース（現在1/3回服用済み）
    const countCard = page
      .locator("div")
      .filter({ hasText: /^no-image回帰テスト 回数ベース残り:19錠/ });

    // 現在の状態確認：1回服用済み
    await expect(countCard.locator("text=1回目の服用")).toBeVisible();
    await expect(countCard.locator("text=目標: 1 / 3 回")).toBeVisible();

    // 残り容量を記録（19錠）
    await expect(countCard.locator("text=19")).toBeVisible();

    // 日付変更をシミュレート（現在時刻を翌日の午前0時5分に設定）
    const currentTime = new Date();
    const tomorrow = new Date(currentTime);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 5, 0, 0); // 翌日の0時5分

    await page.clock.setFixedTime(tomorrow);

    // ページをリロードして日付変更を反映
    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    // 日付チェックインターバル（1分間隔）が動作するまで待機
    await page.waitForTimeout(65000); // 65秒待機

    // リセット後の状態確認：0回にリセット
    await expect(countCard.locator("text=未服用")).toBeVisible({
      timeout: 10000,
    });
    await expect(countCard.locator("text=目標: 0 / 3 回")).toBeVisible();

    // 残り容量は変更されないことを確認（19錠のまま）
    await expect(countCard.locator("text=19")).toBeVisible();
  });

  test.skip("タイミングベースサプリの日付変更リセットテスト", async ({
    page,
  }) => {
    // テスト対象：Phase3.2-日付変更回帰テスト（現在朝・夜服用済み）
    const timingCard = page
      .locator("div")
      .filter({ hasText: /^no-imagePhase3\.2-日付変更回帰テスト残り:18錠/ });

    // 現在の状態確認：朝・夜が「取り消し」状態（服用済み）
    await expect(
      timingCard.getByRole("button", { name: /朝の服用を取り消し/ })
    ).toBeVisible({ timeout: 10000 });
    await expect(
      timingCard.getByRole("button", { name: /夜の服用を取り消し/ })
    ).toBeVisible();

    // 残り容量を記録（18錠）
    await expect(timingCard.locator("text=18")).toBeVisible();

    // 日付変更をシミュレート（現在時刻を翌日の午前0時5分に設定）
    const currentTime = new Date();
    const tomorrow = new Date(currentTime);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 5, 0, 0); // 翌日の0時5分

    await page.clock.setFixedTime(tomorrow);

    // ページをリロードして日付変更を反映
    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    // 日付チェックインターバル（1分間隔）が動作するまで待機
    await page.waitForTimeout(65000); // 65秒待機

    // リセット後の状態確認：すべて「記録」状態にリセット
    await expect(
      timingCard.getByRole("button", { name: /朝の服用を記録/ })
    ).toBeVisible({ timeout: 10000 });
    await expect(
      timingCard.getByRole("button", { name: /夜の服用を記録/ })
    ).toBeVisible();

    // 残り容量は変更されないことを確認（18錠のまま）
    await expect(timingCard.locator("text=18")).toBeVisible();
  });

  test.skip("混在環境での日付変更リセット検証", async ({ page }) => {
    // タイミングベース：Phase3.2-日付変更回帰テスト
    const timingCard = page
      .locator("div")
      .filter({ hasText: /^no-imagePhase3\.2-日付変更回帰テスト残り:18錠/ });

    // 回数ベース：回帰テスト 回数ベース
    const countCard = page
      .locator("div")
      .filter({ hasText: /^no-image回帰テスト 回数ベース残り:19錠/ });

    // 現在の状態確認
    // タイミング: 朝・夜服用済み（取り消しボタン表示）
    await expect(
      timingCard.getByRole("button", { name: /朝の服用を取り消し/ })
    ).toBeVisible({ timeout: 10000 });
    await expect(
      timingCard.getByRole("button", { name: /夜の服用を取り消し/ })
    ).toBeVisible();

    // 回数ベース: 1回服用済み
    await expect(countCard.locator("text=1回目の服用")).toBeVisible();
    await expect(countCard.locator("text=目標: 1 / 3 回")).toBeVisible();

    // 日付変更をシミュレート（現在時刻を翌日の午前0時5分に設定）
    const currentTime = new Date();
    const tomorrow = new Date(currentTime);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 5, 0, 0); // 翌日の0時5分

    await page.clock.setFixedTime(tomorrow);

    // ページをリロードして日付変更を反映
    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    // 日付チェックインターバル（1分間隔）が動作するまで待機
    await page.waitForTimeout(65000); // 65秒待機

    // リセット後の状態確認
    // タイミング: 記録ボタンに戻る
    await expect(
      timingCard.getByRole("button", { name: /朝の服用を記録/ })
    ).toBeVisible({ timeout: 10000 });
    await expect(
      timingCard.getByRole("button", { name: /夜の服用を記録/ })
    ).toBeVisible();

    // 回数ベース: 0回にリセット
    await expect(countCard.locator("text=未服用")).toBeVisible();
    await expect(countCard.locator("text=目標: 0 / 3 回")).toBeVisible();

    // 残り容量は変更されない
    await expect(timingCard.locator("text=18")).toBeVisible();
    await expect(countCard.locator("text=19")).toBeVisible();
  });
});
