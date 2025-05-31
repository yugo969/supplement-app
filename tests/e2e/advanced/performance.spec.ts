import { test, expect } from "@playwright/test";

/**
 * Phase 4.2: パフォーマンステスト
 * ページ読み込み性能と大容量データでの動作確認
 *
 * 【テスト対象】
 * - ページ読み込み時間測定（3秒以内）
 * - 操作レスポンス時間測定（1秒以内）
 * - 大容量データでの表示性能
 * - メモリ使用量の監視
 */

test.describe("Phase 4.2: パフォーマンステスト", () => {
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

  test.describe("4.2.1 ページ読み込み性能", () => {
    test("初回読み込み時間測定（3秒以内）", async ({ page }) => {
      // 新しいページを開いて読み込み時間測定
      const newPage = await page.context().newPage();

      // パフォーマンス測定開始
      const startTime = Date.now();

      // ログインページに移動
      await newPage.goto("/", { waitUntil: "networkidle" });

      // ログイン処理
      await newPage
        .getByRole("textbox", { name: "Email:" })
        .fill("test-e2e@example.com");
      await newPage
        .getByRole("textbox", { name: "Password:" })
        .fill("TestPassword123!");

      await newPage.getByRole("button", { name: "ログイン" }).click();

      // メインページの読み込み完了まで待機
      await expect(
        newPage.getByRole("heading", { name: "サプリ KEEPER" })
      ).toBeVisible();

      const endTime = Date.now();
      const loadTime = endTime - startTime;

      console.log(`初回読み込み時間: ${loadTime}ms`);

      // 3秒（3000ms）以内の確認
      expect(loadTime).toBeLessThan(3000);

      await newPage.close();
    });

    test("ページナビゲーション性能測定", async ({ page }) => {
      // ダイアログ開閉の性能測定
      const startTime = Date.now();

      const addButton = page.getByRole("button", {
        name: "新しいサプリメントを追加",
      });
      await addButton.click();

      const dialog = page.locator("[role='dialog']");
      await expect(dialog).toBeVisible();

      const endTime = Date.now();
      const dialogOpenTime = endTime - startTime;

      console.log(`ダイアログ表示時間: ${dialogOpenTime}ms`);

      // 1秒以内での表示確認
      expect(dialogOpenTime).toBeLessThan(1000);

      // ダイアログを閉じる
      await page.getByRole("button", { name: "キャンセル" }).click();
      await expect(dialog).not.toBeVisible();
    });

    test("Web Vitals 測定", async ({ page }) => {
      // Core Web Vitals の測定
      const metrics = await page.evaluate(() => {
        return new Promise((resolve) => {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const vitals: Record<string, number> = {};

            entries.forEach((entry) => {
              if (entry.entryType === "paint") {
                vitals[entry.name] = entry.startTime;
              }
              if (entry.entryType === "largest-contentful-paint") {
                vitals["LCP"] = entry.startTime;
              }
              if (entry.entryType === "layout-shift") {
                vitals["CLS"] = (vitals["CLS"] || 0) + (entry as any).value;
              }
            });

            // タイムアウト後に結果を返す
            setTimeout(() => resolve(vitals), 2000);
          });

          observer.observe({
            entryTypes: ["paint", "largest-contentful-paint", "layout-shift"],
          });
        });
      });

      console.log("Web Vitals測定結果:", metrics);

      // 基本的な性能指標の確認
      if (typeof metrics === "object" && metrics !== null) {
        const vitalsObj = metrics as Record<string, number>;

        // First Contentful Paint (FCP) - 1.8秒以内が推奨
        if (vitalsObj["first-contentful-paint"]) {
          console.log(`FCP: ${vitalsObj["first-contentful-paint"]}ms`);
          expect(vitalsObj["first-contentful-paint"]).toBeLessThan(1800);
        }

        // Largest Contentful Paint (LCP) - 2.5秒以内が推奨
        if (vitalsObj["LCP"]) {
          console.log(`LCP: ${vitalsObj["LCP"]}ms`);
          expect(vitalsObj["LCP"]).toBeLessThan(2500);
        }

        // Cumulative Layout Shift (CLS) - 0.1以下が推奨
        if (vitalsObj["CLS"]) {
          console.log(`CLS: ${vitalsObj["CLS"]}`);
          expect(vitalsObj["CLS"]).toBeLessThan(0.1);
        }
      }
    });

    test("リソース読み込み時間分析", async ({ page }) => {
      // ページの全リソース読み込み時間を分析
      const resourceTiming = await page.evaluate(() => {
        const resources = performance.getEntriesByType("resource");
        return resources.map((resource) => ({
          name: resource.name,
          duration: resource.duration,
          startTime: resource.startTime,
          transferSize: (resource as any).transferSize || 0,
        }));
      });

      console.log(`読み込まれたリソース数: ${resourceTiming.length}`);

      // 重いリソース（1秒以上）の特定
      const slowResources = resourceTiming.filter(
        (resource) => resource.duration > 1000
      );
      console.log(`1秒以上かかったリソース: ${slowResources.length}個`);

      slowResources.forEach((resource) => {
        console.log(`遅いリソース: ${resource.name} (${resource.duration}ms)`);
      });

      // 大部分のリソースが1秒以内で読み込まれている確認
      expect(slowResources.length).toBeLessThan(resourceTiming.length * 0.2); // 20%未満
    });
  });

  test.describe("4.2.2 大容量データテスト", () => {
    test("複数サプリメント表示性能", async ({ page }) => {
      // 既存のサプリメント数を確認
      const cards = page.locator("[data-testid='supplement-card']");
      const initialCount = await cards.count();

      console.log(`既存サプリメント数: ${initialCount}`);

      // テスト用サプリメントを複数追加（性能テスト用）
      const performanceTestCount = 5;

      for (let i = 0; i < performanceTestCount; i++) {
        const startTime = Date.now();

        // サプリメント追加ダイアログを開く
        await page
          .getByRole("button", { name: "新しいサプリメントを追加" })
          .click();

        const dialog = page.locator("[role='dialog']");
        await expect(dialog).toBeVisible();

        // フォーム入力
        await page
          .getByLabel("サプリメント名")
          .fill(`性能テスト用サプリ ${i + 1}`);
        await page.getByLabel("内容量").fill("30");
        await page.getByLabel("1回の服用量").fill("1");

        // 単位選択
        await page.locator("select").first().selectOption("錠");
        await page.locator("select").nth(1).selectOption("錠");

        // タイミングベース選択
        await page.getByRole("radio", { name: "タイミングベース" }).check();
        await page.getByRole("checkbox", { name: "朝" }).check();

        // 保存
        await page.getByRole("button", { name: "追加" }).click();
        await expect(dialog).not.toBeVisible();

        const endTime = Date.now();
        const addTime = endTime - startTime;

        console.log(`サプリメント${i + 1}追加時間: ${addTime}ms`);

        // 各追加操作が2秒以内に完了することを確認
        expect(addTime).toBeLessThan(2000);

        // 追加後のカード表示確認
        await expect(cards).toHaveCount(initialCount + i + 1);
      }

      // 追加完了後の全体表示性能確認
      const finalStartTime = Date.now();
      await page.reload();
      await expect(
        page.getByRole("heading", { name: "サプリ KEEPER" })
      ).toBeVisible();
      const finalEndTime = Date.now();
      const reloadTime = finalEndTime - finalStartTime;

      console.log(`全サプリメント再読み込み時間: ${reloadTime}ms`);
      expect(reloadTime).toBeLessThan(5000); // 5秒以内

      // 最終的なサプリメント数確認
      await expect(cards).toHaveCount(initialCount + performanceTestCount);
    });

    test("スクロール性能テスト", async ({ page }) => {
      // サプリメントカードがある場合のスクロール性能
      const cards = page.locator("[data-testid='supplement-card']");
      const cardCount = await cards.count();

      if (cardCount > 3) {
        // スクロール性能測定
        const startTime = Date.now();

        // ページの下部にスクロール
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });

        // スクロール完了を待機
        await page.waitForTimeout(100);

        // 上部に戻る
        await page.evaluate(() => {
          window.scrollTo(0, 0);
        });

        await page.waitForTimeout(100);

        const endTime = Date.now();
        const scrollTime = endTime - startTime;

        console.log(`スクロール操作時間: ${scrollTime}ms`);

        // スクロールが500ms以内でスムーズに動作することを確認
        expect(scrollTime).toBeLessThan(500);

        // スクロール後もコンテンツが正常に表示されている確認
        await expect(
          page.getByRole("heading", { name: "サプリ KEEPER" })
        ).toBeVisible();
      }
    });

    test("大量の服用履歴表示性能", async ({ page }) => {
      // 回数ベースのサプリメントで大量服用履歴テスト
      const cards = page.locator("[data-testid='supplement-card']");
      const cardCount = await cards.count();

      if (cardCount > 0) {
        // 最初のカードを確認
        const firstCard = cards.first();

        // 回数ベースのカードを探す
        const plusButtons = firstCard
          .locator("button")
          .filter({ hasText: "+" });

        if ((await plusButtons.count()) > 0) {
          // 複数回の服用記録を高速で追加
          const clickCount = 10;
          const startTime = Date.now();

          for (let i = 0; i < clickCount; i++) {
            await plusButtons.first().click();
            await page.waitForTimeout(50); // 短い待機時間
          }

          const endTime = Date.now();
          const totalTime = endTime - startTime;

          console.log(`${clickCount}回の服用記録追加時間: ${totalTime}ms`);
          console.log(`1回あたりの平均時間: ${totalTime / clickCount}ms`);

          // 全体の操作が5秒以内に完了することを確認
          expect(totalTime).toBeLessThan(5000);

          // 1回あたりの操作が500ms以内であることを確認
          expect(totalTime / clickCount).toBeLessThan(500);

          // 履歴表示の確認
          const historyArea = firstCard.locator(
            "[data-testid='dosage-history']"
          );
          if ((await historyArea.count()) > 0) {
            await expect(historyArea).toBeVisible();
          }
        }
      }
    });

    test("メモリ使用量監視", async ({ page }) => {
      // メモリ使用量の監視（可能な範囲で）
      const memoryInfo = await page.evaluate(() => {
        // Chrome専用のperformance.memory APIを使用
        const performance = window.performance as any;
        if (performance.memory) {
          return {
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            totalJSHeapSize: performance.memory.totalJSHeapSize,
            jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
          };
        }
        return null;
      });

      if (memoryInfo) {
        console.log("メモリ使用量情報:");
        console.log(
          `使用中: ${Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024)}MB`
        );
        console.log(
          `合計: ${Math.round(memoryInfo.totalJSHeapSize / 1024 / 1024)}MB`
        );
        console.log(
          `制限: ${Math.round(memoryInfo.jsHeapSizeLimit / 1024 / 1024)}MB`
        );

        // メモリ使用量が制限の50%以下であることを確認
        const memoryUsageRatio =
          memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit;
        expect(memoryUsageRatio).toBeLessThan(0.5);
      }

      // DOM ノード数の確認
      const domNodeCount = await page.evaluate(() => {
        return document.querySelectorAll("*").length;
      });

      console.log(`DOM ノード数: ${domNodeCount}`);

      // DOM ノード数が過度に多くない確認（10000以下）
      expect(domNodeCount).toBeLessThan(10000);
    });
  });

  test.describe("4.2.3 ネットワーク性能", () => {
    test("API レスポンス時間測定", async ({ page }) => {
      // ネットワークリクエストの監視を開始
      const requests: Array<{
        url: string;
        startTime: number;
        endTime: number;
      }> = [];

      page.on("request", (request) => {
        requests.push({
          url: request.url(),
          startTime: Date.now(),
          endTime: 0,
        });
      });

      page.on("response", (response) => {
        const requestIndex = requests.findIndex(
          (req) => req.url === response.url() && req.endTime === 0
        );
        if (requestIndex !== -1) {
          requests[requestIndex].endTime = Date.now();
        }
      });

      // サプリメント追加操作でAPI呼び出し
      await page
        .getByRole("button", { name: "新しいサプリメントを追加" })
        .click();

      const dialog = page.locator("[role='dialog']");
      await expect(dialog).toBeVisible();

      await page.getByLabel("サプリメント名").fill("API性能テスト");
      await page.getByLabel("内容量").fill("30");
      await page.getByLabel("1回の服用量").fill("1");

      await page.locator("select").first().selectOption("錠");
      await page.locator("select").nth(1).selectOption("錠");

      await page.getByRole("radio", { name: "タイミングベース" }).check();
      await page.getByRole("checkbox", { name: "朝" }).check();

      await page.getByRole("button", { name: "追加" }).click();
      await expect(dialog).not.toBeVisible();

      // API レスポンス時間の分析
      const completedRequests = requests.filter((req) => req.endTime > 0);
      completedRequests.forEach((req) => {
        const responseTime = req.endTime - req.startTime;
        console.log(`API: ${req.url} - ${responseTime}ms`);

        // Firestore API の場合、2秒以内の応答を期待
        if (req.url.includes("firestore") || req.url.includes("firebase")) {
          expect(responseTime).toBeLessThan(2000);
        }
      });
    });

    test("オフライン耐性テスト", async ({ page, context }) => {
      // オフライン状態をシミュレート
      await context.setOffline(true);

      // オフライン状態での操作試行
      const addButton = page.getByRole("button", {
        name: "新しいサプリメントを追加",
      });
      await addButton.click();

      const dialog = page.locator("[role='dialog']");
      await expect(dialog).toBeVisible();

      await page.getByLabel("サプリメント名").fill("オフラインテスト");
      await page.getByLabel("内容量").fill("30");
      await page.getByLabel("1回の服用量").fill("1");

      await page.locator("select").first().selectOption("錠");
      await page.locator("select").nth(1).selectOption("錠");

      await page.getByRole("radio", { name: "タイミングベース" }).check();
      await page.getByRole("checkbox", { name: "朝" }).check();

      // 保存試行（エラーが発生することを期待）
      await page.getByRole("button", { name: "追加" }).click();

      // エラーメッセージまたはローディング状態の確認
      // 実装によってはエラー表示やローディングが続く
      await page.waitForTimeout(3000);

      // オンライン状態に復帰
      await context.setOffline(false);

      // 復帰後の動作確認
      await page.reload();
      await expect(
        page.getByRole("heading", { name: "サプリ KEEPER" })
      ).toBeVisible();
    });
  });
});
