import { test, expect } from "@playwright/test";
import { E2E_EMAIL, E2E_PASSWORD } from "../utils/auth-credentials";

/**
 * サプリメント基本CRUD操作 E2Eテスト
 * 実際のブラウザ操作で検証済みのCRUD機能をテスト化
 */

test.describe("サプリメント基本CRUD操作", () => {
  test.beforeEach(async ({ page }) => {
    // テスト前にログイン
    await page.goto("/");
    await expect(page).toHaveURL(/.*login/);

    // 事前作成済みのテストアカウントでログイン
    await page.getByRole("textbox", { name: "Email:" }).fill(E2E_EMAIL);
    await page.getByRole("textbox", { name: "Password:" }).fill(E2E_PASSWORD);
    await page.getByRole("button", { name: "ログイン" }).click();

    // ログイン成功を確認
    await expect(page).toHaveURL(/.*\/$/);
    await expect(
      page.getByRole("heading", { name: "サプリ KEEPER" })
    ).toBeVisible();
  });

  test.describe("サプリメント追加機能", () => {
    test("基本情報での新規サプリメント追加が成功する", async ({ page }) => {
      // サプリ追加ダイアログを開く
      await page.getByRole("button", { name: "サプリを追加" }).click();

      // サプリ追加ダイアログの表示確認
      await expect(
        page.getByRole("dialog", { name: "サプリ追加" })
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "サプリ追加" })
      ).toBeVisible();

      // テスト用のユニークなサプリ名を生成
      const testSupplementName = `テストサプリ-${Date.now()}`;

      // 基本情報の入力
      await page
        .getByRole("textbox", { name: "サプリ名" })
        .fill(testSupplementName);

      // 内容量設定（30錠）
      await page
        .getByRole("textbox", { name: "サプリメント全体の内容量の数値" })
        .fill("30");

      // 一回服用量は既定値「1」のまま使用

      // 時間帯設定（朝・夜）
      await page.getByRole("checkbox", { name: "朝" }).click();
      await page.getByRole("checkbox", { name: "夜" }).click();

      // 推奨服用方法設定（食後）
      await page.getByRole("radio", { name: "食後" }).click();

      // サプリメント登録実行
      await page.getByRole("button", { name: "登録" }).click();

      // 登録成功の確認
      await expect(page).toHaveURL(/.*\/$/);

      // 成功通知の確認
      await expect(
        page.getByRole("dialog", { name: "サプリ情報を追加しました" })
      ).toBeVisible();

      // 一覧にサプリメントが追加されたことを確認（ユニークな名前で特定）
      await expect(page.getByText(testSupplementName)).toBeVisible();

      // 作成したサプリメントのカードを特定
      const supplementCard = page.locator(`[id*="supplement-card"]`).filter({
        hasText: testSupplementName,
      });

      // そのカード内の要素を確認
      await expect(supplementCard.getByText("残り:")).toBeVisible();
      await expect(supplementCard.getByText("30")).toBeVisible();
      await expect(supplementCard.getByText("錠")).toBeVisible();

      // タイミングボタンの表示確認
      await expect(
        supplementCard.getByRole("button", { name: "朝の服用を記録" })
      ).toBeVisible();
      await expect(
        supplementCard.getByRole("button", { name: "夜の服用を記録" })
      ).toBeVisible();

      console.log(`✅ サプリメント追加成功: ${testSupplementName}`);
    });

    test("入力バリデーションが正常に動作する", async ({ page }) => {
      await page.getByRole("button", { name: "サプリを追加" }).click();

      // サプリ名未入力での登録試行
      await page.getByRole("button", { name: "登録" }).click();

      // ダイアログが閉じないことを確認（バリデーションエラー）
      await expect(
        page.getByRole("dialog", { name: "サプリ追加" })
      ).toBeVisible();

      console.log("✅ バリデーションエラーの動作確認");
    });
  });

  test.describe("サプリメント編集機能", () => {
    test("既存サプリメントの編集が成功する", async ({ page }) => {
      // 事前にサプリメントを追加
      await page.getByRole("button", { name: "サプリを追加" }).click();

      const originalName = `編集テスト-${Date.now()}`;
      await page.getByRole("textbox", { name: "サプリ名" }).fill(originalName);
      await page
        .getByRole("textbox", { name: "サプリメント全体の内容量の数値" })
        .fill("20");
      await page.getByRole("checkbox", { name: "朝" }).click();
      await page.getByRole("button", { name: "登録" }).click();

      // 登録完了を待機
      await expect(page.getByText(originalName)).toBeVisible();

      // 編集ダイアログを開く
      await page.getByRole("button", { name: `${originalName}を編集` }).click();

      // 編集ダイアログの表示確認
      await expect(
        page.getByRole("dialog", { name: "サプリ編集" })
      ).toBeVisible();

      // 既存データの表示確認
      await expect(page.getByRole("textbox", { name: "サプリ名" })).toHaveValue(
        originalName
      );
      await expect(
        page.getByRole("textbox", { name: "サプリメント全体の内容量の数値" })
      ).toHaveValue("20");

      // サプリ名を編集
      const editedName = `${originalName}（編集済み）`;
      await page.getByRole("textbox", { name: "サプリ名" }).fill(editedName);

      // 編集実行
      await page.getByRole("button", { name: "編集" }).click();

      // 編集成功の確認
      await expect(
        page.getByRole("dialog", { name: "サプリ情報を編集しました" })
      ).toBeVisible();

      // 一覧の更新確認
      await expect(page.getByText(editedName)).toBeVisible();

      // 待機時間を追加して、DOMの更新を待つ
      await page.waitForTimeout(1000);

      console.log(`✅ サプリメント編集成功: ${originalName} → ${editedName}`);
    });
  });

  test.describe("サプリメント削除機能", () => {
    test("サプリメントの削除が成功する", async ({ page }) => {
      // 事前にサプリメントを追加
      await page.getByRole("button", { name: "サプリを追加" }).click();

      const testName = `削除テスト-${Date.now()}`;
      await page.getByRole("textbox", { name: "サプリ名" }).fill(testName);
      await page
        .getByRole("textbox", { name: "サプリメント全体の内容量の数値" })
        .fill("10");
      await page.getByRole("checkbox", { name: "朝" }).click();
      await page.getByRole("button", { name: "登録" }).click();

      // 登録完了を待機
      await expect(page.getByText(testName)).toBeVisible();

      // 削除ボタンをクリック
      await page.getByRole("button", { name: `${testName}を削除` }).click();

      // 削除確認ダイアログの処理を待機
      await page.waitForTimeout(1000);

      // 削除後に一覧から除去されることを確認
      await expect(page.getByText(testName)).not.toBeVisible({
        timeout: 15000,
      });

      console.log(`✅ サプリメント削除成功: ${testName}`);
    });
  });

  test.describe("服用記録機能", () => {
    test("服用記録時の残り容量反映が正常に動作する", async ({ page }) => {
      // サプリメントを追加
      await page.getByRole("button", { name: "サプリを追加" }).click();

      const testName = `服用テスト-${Date.now()}`;
      await page.getByRole("textbox", { name: "サプリ名" }).fill(testName);
      await page
        .getByRole("textbox", { name: "サプリメント全体の内容量の数値" })
        .fill("25");
      await page.getByRole("checkbox", { name: "朝" }).click();
      await page.getByRole("checkbox", { name: "夜" }).click();
      await page.getByRole("button", { name: "登録" }).click();

      // 登録完了を待機
      await expect(page.getByText(testName)).toBeVisible();

      // 作成したサプリメントのカードを特定
      const supplementCard = page.locator(`[id*="supplement-card"]`).filter({
        hasText: testName,
      });

      await expect(supplementCard.getByText("25")).toBeVisible();

      // 朝の服用を記録
      await supplementCard
        .getByRole("button", { name: "朝の服用を記録" })
        .click();

      // 残り容量の減少確認（25 → 24）
      await expect(supplementCard.getByText("24")).toBeVisible();

      // ボタン状態の変更確認
      await expect(
        supplementCard.getByRole("button", { name: "朝の服用を取り消し" })
      ).toBeVisible();

      // 夜のボタンは変更されないことを確認
      await expect(
        supplementCard.getByRole("button", { name: "夜の服用を記録" })
      ).toBeVisible();

      // 服用取り消し機能のテスト
      await supplementCard
        .getByRole("button", { name: "朝の服用を取り消し" })
        .click();

      // 残り容量の復元確認（24 → 25）
      await expect(supplementCard.getByText("25")).toBeVisible();

      // ボタン状態の復元確認
      await expect(
        supplementCard.getByRole("button", { name: "朝の服用を記録" })
      ).toBeVisible();

      console.log(`✅ 服用記録・取り消し機能の正常動作確認: ${testName}`);
    });

    test("複数タイミングでの服用記録が正常に動作する", async ({ page }) => {
      // サプリメントを追加（朝・昼・夜の3タイミング）
      await page.getByRole("button", { name: "サプリを追加" }).click();

      const testName = `複数タイミングテスト-${Date.now()}`;
      await page.getByRole("textbox", { name: "サプリ名" }).fill(testName);
      await page
        .getByRole("textbox", { name: "サプリメント全体の内容量の数値" })
        .fill("30");
      await page.getByRole("checkbox", { name: "朝" }).click();
      await page.getByRole("checkbox", { name: "昼" }).click();
      await page.getByRole("checkbox", { name: "夜" }).click();
      await page.getByRole("button", { name: "登録" }).click();

      // 登録完了を待機
      await expect(page.getByText(testName)).toBeVisible();

      // 作成したサプリメントのカードを特定
      const supplementCard = page.locator(`[id*="supplement-card"]`).filter({
        hasText: testName,
      });

      await expect(supplementCard.getByText("30")).toBeVisible();

      // 朝の服用記録
      await supplementCard
        .getByRole("button", { name: "朝の服用を記録" })
        .click();
      await expect(supplementCard.getByText("29")).toBeVisible();

      // 昼の服用記録
      await supplementCard
        .getByRole("button", { name: "昼の服用を記録" })
        .click();
      await expect(supplementCard.getByText("28")).toBeVisible();

      // 夜の服用記録
      await supplementCard
        .getByRole("button", { name: "夜の服用を記録" })
        .click();
      await expect(supplementCard.getByText("27")).toBeVisible();

      // 全タイミングのボタン状態確認
      await expect(
        supplementCard.getByRole("button", { name: "朝の服用を取り消し" })
      ).toBeVisible();
      await expect(
        supplementCard.getByRole("button", { name: "昼の服用を取り消し" })
      ).toBeVisible();
      await expect(
        supplementCard.getByRole("button", { name: "夜の服用を取り消し" })
      ).toBeVisible();

      console.log(`✅ 複数タイミング服用記録の正常動作確認: ${testName}`);
    });
  });
});
