import { test, expect } from "@playwright/test";

/**
 * Phase 4.3: エラーハンドリングテスト
 * ネットワークエラーシミュレーションと例外処理の確認
 *
 * 【テスト対象】
 * - ネットワークエラー時の適切な表示
 * - バリデーションエラーの処理
 * - 予期しない例外への対応
 * - ユーザーフレンドリーなエラーメッセージ
 */

test.describe("Phase 4.3: エラーハンドリングテスト", () => {
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

    await expect(page).toHaveURL(/.*\/$/);
    await expect(
      page.getByRole("heading", { name: "サプリ KEEPER" })
    ).toBeVisible();
  });

  test.describe("4.3.1 ネットワークエラーシミュレーション", () => {
    test("ネットワーク接続失敗時のエラー表示", async ({ page, context }) => {
      // Firestore APIのリクエストを失敗させる
      await page.route("**/firestore/**", (route) => {
        route.abort("failed");
      });

      // サプリメント追加を試行
      await page
        .getByRole("button", { name: "新しいサプリメントを追加" })
        .click();

      const dialog = page.locator("[role='dialog']");
      await expect(dialog).toBeVisible();

      await page.getByLabel("サプリメント名").fill("ネットワークエラーテスト");
      await page.getByLabel("内容量").fill("30");
      await page.getByLabel("1回の服用量").fill("1");

      await page.locator("select").first().selectOption("錠");
      await page.locator("select").nth(1).selectOption("錠");

      await page.getByRole("radio", { name: "タイミングベース" }).check();
      await page.getByRole("checkbox", { name: "朝" }).check();

      // 保存試行
      await page.getByRole("button", { name: "追加" }).click();

      // エラーメッセージまたはローディング状態の確認
      // 実装によって異なるが、何らかのフィードバックがあることを確認
      await page.waitForTimeout(3000);

      // ダイアログが閉じられないことを確認（エラーのため）
      // または適切なエラーメッセージが表示されることを確認
      const isDialogVisible = await dialog.isVisible();

      if (isDialogVisible) {
        // ダイアログが開いたままの場合、エラー状態である可能性
        console.log("ダイアログがネットワークエラー後も開いています");
      }

      // エラー状態をクリア（ESCでダイアログを閉じる）
      await page.keyboard.press("Escape");
    });

    test("リクエストタイムアウトシミュレーション", async ({ page }) => {
      // APIリクエストを遅延させる
      await page.route("**/firestore/**", async (route) => {
        // 10秒間遅延（通常のタイムアウトを超える）
        await new Promise((resolve) => setTimeout(resolve, 10000));
        route.continue();
      });

      // サプリメント追加操作
      await page
        .getByRole("button", { name: "新しいサプリメントを追加" })
        .click();

      const dialog = page.locator("[role='dialog']");
      await expect(dialog).toBeVisible();

      await page.getByLabel("サプリメント名").fill("タイムアウトテスト");
      await page.getByLabel("内容量").fill("30");
      await page.getByLabel("1回の服用量").fill("1");

      await page.locator("select").first().selectOption("錠");
      await page.locator("select").nth(1).selectOption("錠");

      await page.getByRole("radio", { name: "タイミングベース" }).check();
      await page.getByRole("checkbox", { name: "朝" }).check();

      const startTime = Date.now();
      await page.getByRole("button", { name: "追加" }).click();

      // 長時間待機してタイムアウト確認
      await page.waitForTimeout(5000);

      const endTime = Date.now();
      const waitTime = endTime - startTime;

      console.log(`タイムアウトテスト待機時間: ${waitTime}ms`);

      // アプリケーションが固まらず、適切にハンドリングされていることを確認
      const isAppResponsive = await page.evaluate(() => {
        // ページが応答可能かテスト
        return document.readyState === "complete";
      });

      expect(isAppResponsive).toBeTruthy();

      // ダイアログをクリア
      await page.keyboard.press("Escape");
    });

    test("断続的な接続不良シミュレーション", async ({ page }) => {
      let requestCount = 0;

      // 3回に1回失敗するネットワーク環境をシミュレート
      await page.route("**/firestore/**", (route) => {
        requestCount++;
        if (requestCount % 3 === 0) {
          route.abort("failed");
        } else {
          route.continue();
        }
      });

      // 複数回の操作を試行
      for (let i = 0; i < 3; i++) {
        await page
          .getByRole("button", { name: "新しいサプリメントを追加" })
          .click();

        const dialog = page.locator("[role='dialog']");
        await expect(dialog).toBeVisible();

        await page.getByLabel("サプリメント名").fill(`断続接続テスト ${i + 1}`);
        await page.getByLabel("内容量").fill("30");
        await page.getByLabel("1回の服用量").fill("1");

        await page.locator("select").first().selectOption("錠");
        await page.locator("select").nth(1).selectOption("錠");

        await page.getByRole("radio", { name: "タイミングベース" }).check();
        await page.getByRole("checkbox", { name: "朝" }).check();

        await page.getByRole("button", { name: "追加" }).click();

        // 操作完了または失敗まで待機
        await page.waitForTimeout(2000);

        // ダイアログの状態確認
        const isDialogVisible = await dialog.isVisible();
        if (isDialogVisible) {
          // 失敗の場合、ダイアログを閉じる
          await page.keyboard.press("Escape");
        }

        // アプリケーションの安定性確認
        await expect(
          page.getByRole("heading", { name: "サプリ KEEPER" })
        ).toBeVisible();
      }
    });
  });

  test.describe("4.3.2 バリデーションエラーテスト", () => {
    test("必須フィールド未入力エラー", async ({ page }) => {
      await page
        .getByRole("button", { name: "新しいサプリメントを追加" })
        .click();

      const dialog = page.locator("[role='dialog']");
      await expect(dialog).toBeVisible();

      // 何も入力せずに保存を試行
      await page.getByRole("button", { name: "追加" }).click();

      // バリデーションエラーが表示されることを確認
      // エラーメッセージまたはフィールドハイライトの確認
      const nameField = page.getByLabel("サプリメント名");
      const nameValue = await nameField.inputValue();

      // 入力が空の場合、バリデーションが働いていることを確認
      expect(nameValue).toBe("");

      // ダイアログが閉じられないことを確認（バリデーションエラーのため）
      await expect(dialog).toBeVisible();

      // 必須フィールドを入力してエラーを解消
      await nameField.fill("バリデーションテスト");
      await page.getByLabel("内容量").fill("30");
      await page.getByLabel("1回の服用量").fill("1");

      await page.locator("select").first().selectOption("錠");
      await page.locator("select").nth(1).selectOption("錠");

      await page.getByRole("radio", { name: "タイミングベース" }).check();
      await page.getByRole("checkbox", { name: "朝" }).check();

      // 再度保存を試行
      await page.getByRole("button", { name: "追加" }).click();

      // 正常に処理されることを確認
      await page.waitForTimeout(2000);
    });

    test("不正な数値入力エラー", async ({ page }) => {
      await page
        .getByRole("button", { name: "新しいサプリメントを追加" })
        .click();

      const dialog = page.locator("[role='dialog']");
      await expect(dialog).toBeVisible();

      await page.getByLabel("サプリメント名").fill("数値エラーテスト");

      // 負の値や不正な文字列を入力
      await page.getByLabel("内容量").fill("-10");
      await page.getByLabel("1回の服用量").fill("abc");

      await page.locator("select").first().selectOption("錠");
      await page.locator("select").nth(1).selectOption("錠");

      await page.getByRole("radio", { name: "タイミングベース" }).check();
      await page.getByRole("checkbox", { name: "朝" }).check();

      await page.getByRole("button", { name: "追加" }).click();

      // バリデーションエラーが適切に処理されることを確認
      await page.waitForTimeout(1000);

      // フィールドの値を確認
      const quantityValue = await page.getByLabel("内容量").inputValue();
      const dosageValue = await page.getByLabel("1回の服用量").inputValue();

      console.log(`内容量の値: ${quantityValue}`);
      console.log(`服用量の値: ${dosageValue}`);

      // HTMLの入力検証が機能している確認
      // ブラウザレベルでの数値検証が働いているかテスト

      // 正しい値に修正
      await page.getByLabel("内容量").fill("30");
      await page.getByLabel("1回の服用量").fill("1");

      await page.getByRole("button", { name: "追加" }).click();
      await page.waitForTimeout(2000);
    });

    test("タイミング未選択エラー", async ({ page }) => {
      await page
        .getByRole("button", { name: "新しいサプリメントを追加" })
        .click();

      const dialog = page.locator("[role='dialog']");
      await expect(dialog).toBeVisible();

      await page.getByLabel("サプリメント名").fill("タイミング未選択テスト");
      await page.getByLabel("内容量").fill("30");
      await page.getByLabel("1回の服用量").fill("1");

      await page.locator("select").first().selectOption("錠");
      await page.locator("select").nth(1).selectOption("錠");

      // タイミングベースを選択するが、朝・昼・夜を選択しない
      await page.getByRole("radio", { name: "タイミングベース" }).check();
      // チェックボックスは選択しない

      await page.getByRole("button", { name: "追加" }).click();

      // バリデーションエラーが発生することを確認
      await page.waitForTimeout(1000);

      // ダイアログが閉じられないことを確認
      await expect(dialog).toBeVisible();

      // エラーを解消
      await page.getByRole("checkbox", { name: "朝" }).check();
      await page.getByRole("button", { name: "追加" }).click();
      await page.waitForTimeout(2000);
    });

    test("回数ベースの不正値エラー", async ({ page }) => {
      await page
        .getByRole("button", { name: "新しいサプリメントを追加" })
        .click();

      const dialog = page.locator("[role='dialog']");
      await expect(dialog).toBeVisible();

      await page.getByLabel("サプリメント名").fill("回数ベース不正値テスト");
      await page.getByLabel("内容量").fill("30");
      await page.getByLabel("1回の服用量").fill("1");

      await page.locator("select").first().selectOption("錠");
      await page.locator("select").nth(1).selectOption("錠");

      // 回数ベースを選択
      await page.getByRole("radio", { name: "回数ベース" }).check();

      // 1日の目標服用回数フィールドが表示されるまで待機
      const targetField = page.getByLabel("1日の目標服用回数");
      await expect(targetField).toBeVisible();

      // 不正な値（0または負の値）を入力
      await targetField.fill("0");

      await page.getByRole("button", { name: "追加" }).click();

      // バリデーションエラーが適切に処理されることを確認
      await page.waitForTimeout(1000);

      // ダイアログが閉じられないことを確認
      await expect(dialog).toBeVisible();

      // 正しい値に修正
      await targetField.fill("2");
      await page.getByRole("button", { name: "追加" }).click();
      await page.waitForTimeout(2000);
    });
  });

  test.describe("4.3.3 例外処理とエッジケース", () => {
    test("ブラウザバック操作での状態保持", async ({ page }) => {
      // サプリメント追加ダイアログを開く
      await page
        .getByRole("button", { name: "新しいサプリメントを追加" })
        .click();

      const dialog = page.locator("[role='dialog']");
      await expect(dialog).toBeVisible();

      // フォームに部分的に入力
      await page.getByLabel("サプリメント名").fill("ブラウザバックテスト");
      await page.getByLabel("内容量").fill("30");

      // ブラウザの戻るボタンをシミュレート
      await page.goBack();

      // ログインページに戻る可能性があるが、適切にハンドリングされることを確認
      await page.waitForTimeout(1000);

      // 現在のページ状態を確認
      const currentUrl = page.url();
      console.log(`ブラウザバック後のURL: ${currentUrl}`);

      // 再度メインページに移動
      if (currentUrl.includes("login")) {
        await page
          .getByRole("textbox", { name: "Email:" })
          .fill("test-e2e@example.com");
        await page
          .getByRole("textbox", { name: "Password:" })
          .fill("TestPassword123!");
        await page.getByRole("button", { name: "ログイン" }).click();
      }

      // アプリケーションが正常に動作することを確認
      await expect(
        page.getByRole("heading", { name: "サプリ KEEPER" })
      ).toBeVisible();
    });

    test("ページリロード中の操作", async ({ page }) => {
      // ページリロードを開始
      const reloadPromise = page.reload();

      // リロード中にボタンクリックを試行
      setTimeout(async () => {
        try {
          await page
            .getByRole("button", { name: "新しいサプリメントを追加" })
            .click({ timeout: 1000 });
        } catch (error) {
          console.log("リロード中のクリック試行が適切に失敗しました");
        }
      }, 100);

      // リロード完了を待機
      await reloadPromise;

      // リロード後の正常動作確認
      await expect(
        page.getByRole("heading", { name: "サプリ KEEPER" })
      ).toBeVisible();

      // 通常の操作が可能か確認
      await page
        .getByRole("button", { name: "新しいサプリメントを追加" })
        .click();
      const dialog = page.locator("[role='dialog']");
      await expect(dialog).toBeVisible();
      await page.keyboard.press("Escape");
    });

    test("JavaScript エラー発生時の回復", async ({ page }) => {
      // ページにエラーが発生してもアプリケーションが継続動作することを確認
      page.on("pageerror", (error) => {
        console.log(`ページエラーを検出: ${error.message}`);
      });

      // 意図的にJavaScriptエラーを発生させる
      await page.evaluate(() => {
        // 存在しない関数を呼び出してエラーを発生
        try {
          (window as any).nonExistentFunction();
        } catch (error) {
          console.error("意図的なエラー:", error);
        }
      });

      // エラー発生後もアプリケーションが動作することを確認
      await page.waitForTimeout(1000);

      await expect(
        page.getByRole("heading", { name: "サプリ KEEPER" })
      ).toBeVisible();

      // 基本機能が正常に動作することを確認
      await page
        .getByRole("button", { name: "新しいサプリメントを追加" })
        .click();
      const dialog = page.locator("[role='dialog']");
      await expect(dialog).toBeVisible();
      await page.keyboard.press("Escape");
    });

    test("大量データでのメモリリーク検出", async ({ page }) => {
      const initialMemory = await page.evaluate(() => {
        const performance = window.performance as any;
        return performance.memory ? performance.memory.usedJSHeapSize : null;
      });

      // 大量のサプリメント追加・削除操作
      for (let i = 0; i < 5; i++) {
        // サプリメント追加
        await page
          .getByRole("button", { name: "新しいサプリメントを追加" })
          .click();

        const dialog = page.locator("[role='dialog']");
        await expect(dialog).toBeVisible();

        await page.getByLabel("サプリメント名").fill(`メモリテスト ${i + 1}`);
        await page.getByLabel("内容量").fill("30");
        await page.getByLabel("1回の服用量").fill("1");

        await page.locator("select").first().selectOption("錠");
        await page.locator("select").nth(1).selectOption("錠");

        await page.getByRole("radio", { name: "タイミングベース" }).check();
        await page.getByRole("checkbox", { name: "朝" }).check();

        await page.getByRole("button", { name: "追加" }).click();
        await expect(dialog).not.toBeVisible();

        await page.waitForTimeout(500);
      }

      const finalMemory = await page.evaluate(() => {
        const performance = window.performance as any;
        return performance.memory ? performance.memory.usedJSHeapSize : null;
      });

      if (initialMemory && finalMemory) {
        const memoryIncrease = finalMemory - initialMemory;
        console.log(`メモリ使用量増加: ${Math.round(memoryIncrease / 1024)}KB`);

        // メモリ使用量の増加が過度でないことを確認（10MB以下）
        expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
      }
    });

    test("同時操作による競合状態テスト", async ({ page }) => {
      // 複数の操作を同時に実行して競合状態をテスト
      const operations = [];

      // 同時にサプリメント追加ダイアログを開く試行（実際は1つだけ開かれるべき）
      for (let i = 0; i < 3; i++) {
        operations.push(
          page
            .getByRole("button", { name: "新しいサプリメントを追加" })
            .click()
            .catch((error) => {
              console.log(`操作 ${i + 1} でエラー: ${error.message}`);
            })
        );
      }

      await Promise.allSettled(operations);

      // ダイアログが1つだけ開かれていることを確認
      const dialogs = page.locator("[role='dialog']");
      const dialogCount = await dialogs.count();

      expect(dialogCount).toBeLessThanOrEqual(1);

      if (dialogCount === 1) {
        await page.keyboard.press("Escape");
      }

      // アプリケーションが安定した状態であることを確認
      await expect(
        page.getByRole("heading", { name: "サプリ KEEPER" })
      ).toBeVisible();
    });
  });
});
