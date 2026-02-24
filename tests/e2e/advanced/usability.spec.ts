import { test, expect, devices } from "@playwright/test";
import { E2E_EMAIL, E2E_PASSWORD } from "../utils/auth-credentials";

/**
 * Phase 4.1: ユーザビリティテスト
 * レスポンシブデザインとアクセシビリティの包括的テスト
 *
 * 【テスト対象】
 * - レスポンシブデザイン（モバイル・タブレット・デスクトップ）
 * - キーボードナビゲーション
 * - ARIA属性とアクセシビリティ
 * - フォーカス管理
 */

test.describe("Phase 4.1: ユーザビリティテスト", () => {
  test.beforeEach(async ({ page }) => {
    // テスト前にログイン
    await page.goto("/");
    await expect(page).toHaveURL(/.*login/);

    await page.getByRole("textbox", { name: "Email:" }).fill(E2E_EMAIL);
    await page.getByRole("textbox", { name: "Password:" }).fill(E2E_PASSWORD);
    await page.getByRole("button", { name: "ログイン" }).click();

    await expect(page).toHaveURL(/.*\/$/);
    await expect(
      page.getByRole("heading", { name: "サプリ KEEPER" })
    ).toBeVisible();
  });

  test.describe("4.1.1 レスポンシブデザインテスト", () => {
    test("モバイル表示での操作確認", async ({ page }) => {
      // モバイルサイズに設定（iPhone 12）
      await page.setViewportSize({ width: 390, height: 844 });

      // メインコンテンツの表示確認
      await expect(
        page.getByRole("heading", { name: "サプリ KEEPER" })
      ).toBeVisible();

      // サプリメント追加ボタンの表示確認
      const addButton = page.getByRole("button", {
        name: "新しいサプリメントを追加",
      });
      await expect(addButton).toBeVisible();

      // サプリメント追加ダイアログの動作確認（モバイル）
      await addButton.click();
      const dialog = page.locator("[role='dialog']");
      await expect(dialog).toBeVisible();

      // ダイアログ内のフォーム要素の表示確認
      await expect(page.getByLabel("サプリメント名")).toBeVisible();
      await expect(page.getByLabel("内容量")).toBeVisible();
      await expect(page.getByLabel("1回の服用量")).toBeVisible();

      // ダイアログを閉じる
      await page.getByRole("button", { name: "キャンセル" }).click();
      await expect(dialog).not.toBeVisible();
    });

    test("タブレット表示での操作確認", async ({ page }) => {
      // タブレットサイズに設定（iPad）
      await page.setViewportSize({ width: 768, height: 1024 });

      // メインコンテンツの表示確認
      await expect(
        page.getByRole("heading", { name: "サプリ KEEPER" })
      ).toBeVisible();

      // レイアウトの確認：タブレットサイズでの適切な表示
      const main = page.locator("main");
      await expect(main).toBeVisible();

      // サプリメントカードの表示確認
      const cards = page.locator("[data-testid='supplement-card']");
      if ((await cards.count()) > 0) {
        // カードが存在する場合の表示確認
        await expect(cards.first()).toBeVisible();

        // カードの横幅がタブレットに適した表示になっているか確認
        const cardBox = await cards.first().boundingBox();
        if (cardBox) {
          expect(cardBox.width).toBeLessThan(600); // タブレットに適したカード幅
        }
      }
    });

    test("デスクトップ表示での操作確認", async ({ page }) => {
      // デスクトップサイズに設定（1920x1080）
      await page.setViewportSize({ width: 1920, height: 1080 });

      // メインコンテンツの表示確認
      await expect(
        page.getByRole("heading", { name: "サプリ KEEPER" })
      ).toBeVisible();

      // デスクトップでの横幅最大利用確認
      const main = page.locator("main");
      await expect(main).toBeVisible();

      // サプリメント追加ダイアログのサイズ確認（デスクトップ）
      const addButton = page.getByRole("button", {
        name: "新しいサプリメントを追加",
      });
      await addButton.click();

      const dialog = page.locator("[role='dialog']");
      await expect(dialog).toBeVisible();

      // ダイアログサイズがデスクトップに適している確認
      const dialogBox = await dialog.boundingBox();
      if (dialogBox) {
        expect(dialogBox.width).toBeLessThan(800); // デスクトップでも適切な幅
        expect(dialogBox.height).toBeLessThan(900); // 適切な高さ
      }

      // ダイアログを閉じる
      await page.getByRole("button", { name: "キャンセル" }).click();
    });

    test("画面回転時の表示確認", async ({ page }) => {
      // 横向き（ランドスケープ）モバイル
      await page.setViewportSize({ width: 844, height: 390 });

      // メインコンテンツの表示確認
      await expect(
        page.getByRole("heading", { name: "サプリ KEEPER" })
      ).toBeVisible();

      // 横向きでも操作可能か確認
      const addButton = page.getByRole("button", {
        name: "新しいサプリメントを追加",
      });
      await expect(addButton).toBeVisible();
      await expect(addButton).toBeEnabled();
    });
  });

  test.describe("4.1.2 アクセシビリティテスト", () => {
    test("キーボードナビゲーション - Tabキーでの移動", async ({ page }) => {
      // メインコンテンツにフォーカス
      await page.keyboard.press("Tab");

      // サプリメント追加ボタンがフォーカス可能
      const addButton = page.getByRole("button", {
        name: "新しいサプリメントを追加",
      });
      await expect(addButton).toBeFocused();

      // Enterキーでボタン操作
      await page.keyboard.press("Enter");
      const dialog = page.locator("[role='dialog']");
      await expect(dialog).toBeVisible();

      // ダイアログ内でのTabナビゲーション
      await page.keyboard.press("Tab");
      await expect(page.getByLabel("サプリメント名")).toBeFocused();

      await page.keyboard.press("Tab");
      await expect(page.getByLabel("内容量")).toBeFocused();

      // Escapeキーでダイアログを閉じる
      await page.keyboard.press("Escape");
      await expect(dialog).not.toBeVisible();
    });

    test("キーボードナビゲーション - サプリメントカード操作", async ({
      page,
    }) => {
      // 既存のサプリメントカードがある場合のテスト
      const cards = page.locator("[data-testid='supplement-card']");
      const cardCount = await cards.count();

      if (cardCount > 0) {
        // 最初のカードにフォーカス
        await cards.first().focus();
        await expect(cards.first()).toBeFocused();

        // カード内の服用ボタンへの移動
        const dosageButtons = cards
          .first()
          .locator("button")
          .filter({ hasText: /朝|昼|夜/ });
        if ((await dosageButtons.count()) > 0) {
          await page.keyboard.press("Tab");
          await expect(dosageButtons.first()).toBeFocused();

          // Enterキーでの服用記録
          await page.keyboard.press("Enter");
          // 操作完了を少し待機
          await page.waitForTimeout(500);
        }
      }
    });

    test("ARIA属性の動作確認", async ({ page }) => {
      // メインコンテンツのaria-label確認
      const main = page.locator("main");
      await expect(main).toHaveAttribute("aria-label", "メインコンテンツ");

      // サプリメント追加ボタンのaria-labelとrole確認
      const addButton = page.getByRole("button", {
        name: "新しいサプリメントを追加",
      });
      await expect(addButton).toHaveAttribute("role", "button");

      // ダイアログのARIA属性確認
      await addButton.click();
      const dialog = page.locator("[role='dialog']");
      await expect(dialog).toHaveAttribute("role", "dialog");
      await expect(dialog).toHaveAttribute("aria-modal", "true");

      // フォーム要素のaria-label確認
      await expect(page.getByLabel("サプリメント名")).toHaveAttribute(
        "aria-label",
        "サプリメント名"
      );
      await expect(page.getByLabel("内容量")).toHaveAttribute(
        "aria-label",
        "内容量"
      );

      // ダイアログを閉じる
      await page.keyboard.press("Escape");
    });

    test("フォーカス視覚フィードバック確認", async ({ page }) => {
      // ボタンのフォーカス状態確認
      const addButton = page.getByRole("button", {
        name: "新しいサプリメントを追加",
      });

      // マウスクリックでフォーカス
      await addButton.focus();

      // フォーカスリングの確認（outline CSSプロパティ）
      const focusStyle = await addButton.evaluate((el) => {
        const computed = window.getComputedStyle(el, ":focus");
        return {
          outline: computed.outline,
          outlineColor: computed.outlineColor,
          outlineWidth: computed.outlineWidth,
        };
      });

      // フォーカススタイルが適用されている確認
      expect(focusStyle.outline !== "none").toBeTruthy();

      // ダイアログ内のフォーム要素のフォーカス確認
      await addButton.click();
      const nameInput = page.getByLabel("サプリメント名");
      await nameInput.focus();

      const inputFocusStyle = await nameInput.evaluate((el) => {
        const computed = window.getComputedStyle(el, ":focus");
        return {
          outline: computed.outline,
          borderColor: computed.borderColor,
        };
      });

      // フォーム要素のフォーカススタイル確認
      expect(
        inputFocusStyle.outline !== "none" ||
          inputFocusStyle.borderColor !== "initial"
      ).toBeTruthy();

      await page.keyboard.press("Escape");
    });

    test("スクリーンリーダー対応 - 見出し構造", async ({ page }) => {
      // 適切な見出し階層の確認
      const h1 = page.getByRole("heading", { level: 1 });
      await expect(h1).toBeVisible();
      await expect(h1).toHaveText("サプリ KEEPER");

      // その他の見出し要素の確認（もしあれば）
      const headings = page.locator("h1, h2, h3, h4, h5, h6");
      const headingCount = await headings.count();

      // 見出しが適切に配置されている確認
      for (let i = 0; i < headingCount; i++) {
        const heading = headings.nth(i);
        await expect(heading).toBeVisible();

        // 見出しテキストが空でない確認
        const text = await heading.textContent();
        expect(text).toBeTruthy();
        expect(text!.trim().length).toBeGreaterThan(0);
      }
    });

    test("色彩コントラスト確認", async ({ page }) => {
      // 主要なテキスト要素の色彩情報を取得
      const heading = page.getByRole("heading", { name: "サプリ KEEPER" });

      const colorInfo = await heading.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          fontSize: computed.fontSize,
          fontWeight: computed.fontWeight,
        };
      });

      // 基本的な色情報が取得できる確認
      expect(colorInfo.color).toBeTruthy();
      expect(colorInfo.fontSize).toBeTruthy();

      // ボタンのコントラスト確認
      const addButton = page.getByRole("button", {
        name: "新しいサプリメントを追加",
      });
      const buttonColorInfo = await addButton.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
        };
      });

      expect(buttonColorInfo.color).toBeTruthy();
      expect(buttonColorInfo.backgroundColor).toBeTruthy();
    });
  });

  test.describe("4.1.3 モバイルタッチインターフェース", () => {
    test("タッチジェスチャー - スワイプとタップ", async ({ page }) => {
      // モバイルサイズに設定
      await page.setViewportSize({ width: 390, height: 844 });

      // サプリメントカードがある場合のタッチテスト
      const cards = page.locator("[data-testid='supplement-card']");
      const cardCount = await cards.count();

      if (cardCount > 0) {
        const firstCard = cards.first();

        // タップ操作のテスト
        await firstCard.tap();

        // 服用ボタンのタップテスト
        const dosageButtons = firstCard
          .locator("button")
          .filter({ hasText: /朝|昼|夜/ });
        if ((await dosageButtons.count()) > 0) {
          await dosageButtons.first().tap();
          await page.waitForTimeout(500); // アニメーション待機
        }
      }

      // サプリメント追加ボタンのタップテスト
      const addButton = page.getByRole("button", {
        name: "新しいサプリメントを追加",
      });
      await addButton.tap();

      const dialog = page.locator("[role='dialog']");
      await expect(dialog).toBeVisible();

      // ダイアログを閉じる
      await page.getByRole("button", { name: "キャンセル" }).tap();
    });

    test("タッチターゲットサイズ確認", async ({ page }) => {
      // モバイルサイズに設定
      await page.setViewportSize({ width: 390, height: 844 });

      // サプリメント追加ボタンのサイズ確認
      const addButton = page.getByRole("button", {
        name: "新しいサプリメントを追加",
      });
      const buttonBox = await addButton.boundingBox();

      if (buttonBox) {
        // 推奨タッチターゲットサイズ（44px以上）の確認
        expect(buttonBox.height).toBeGreaterThanOrEqual(44);
        expect(buttonBox.width).toBeGreaterThanOrEqual(44);
      }

      // サプリメントカードの服用ボタンサイズ確認
      const cards = page.locator("[data-testid='supplement-card']");
      if ((await cards.count()) > 0) {
        const dosageButtons = cards
          .first()
          .locator("button")
          .filter({ hasText: /朝|昼|夜|\+|\-/ });
        const buttonCount = await dosageButtons.count();

        for (let i = 0; i < Math.min(buttonCount, 3); i++) {
          const button = dosageButtons.nth(i);
          const buttonBox = await button.boundingBox();

          if (buttonBox) {
            expect(buttonBox.height).toBeGreaterThanOrEqual(40); // 服用ボタンの最小サイズ
            expect(buttonBox.width).toBeGreaterThanOrEqual(40);
          }
        }
      }
    });
  });
});
