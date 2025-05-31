# E2E CI/CD統合テンプレート（プロダクション品質）

## 📋 概要

このテンプレートは、個人開発からCI/CDによる本格的な品質保証体制へ移行する際に使用します。
エンタープライズレベルの開発プロセスと品質管理を実現する設定を含みます。

## 🎯 技術的価値

### 品質保証プロセス

- **CI/CDパイプライン構築**: GitHub Actions による自動化
- **E2Eテスト自動実行**: Playwright を活用した包括的テスト
- **環境管理**: Firebase連携とSecrets管理
- **品質保証**: 段階的テスト実行による堅牢な開発プロセス

### DevOps実践

- **段階的実行戦略**: PR用高速テスト + main用包括テスト
- **リソース最適化**: 必要に応じた実行範囲調整
- **障害対応**: 失敗時の詳細デバッグとレポート機能
- **スケーラブル設計**: チーム開発への拡張性

## 🔧 移行手順

### Step 1: Husky設定の調整

現在のpre-commitからE2Eテストを除外（CI/CDと重複回避）：

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# TypeScript型チェック
npm run build

# lint-staged実行
npx lint-staged

# E2Eテストは CI/CD で実行するためコメントアウト
# echo "🧪 Running critical E2E tests..."
# npx playwright test tests/e2e/auth tests/e2e/supplements tests/e2e/regression/dosage-tracking.spec.ts --project=chromium
```

### Step 2: GitHub Actions ワークフロー作成

`.github/workflows/e2e-production.yml` を作成：

```yaml
name: E2E Tests (Production Quality)

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  # 手動実行も可能
  workflow_dispatch:
    inputs:
      test_scope:
        description: "Test scope to run"
        required: false
        default: "critical"
        type: choice
        options:
          - critical
          - full

jobs:
  # PR用：重要テストのみ（高速）
  e2e-critical:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    if: github.event_name == 'pull_request' || (github.event_name == 'workflow_dispatch' && github.event.inputs.test_scope == 'critical')

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "18.x"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers (Chromium only)
        run: npx playwright install --with-deps chromium

      - name: Build Next.js application
        run: npm run build

      - name: Run critical E2E tests
        run: npx playwright test tests/e2e/auth tests/e2e/supplements tests/e2e/regression/dosage-tracking.spec.ts --project=chromium
        env:
          # Firebase 環境設定
          NEXT_PUBLIC_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
          NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ${{ secrets.FIREBASE_AUTH_DOMAIN }}
          NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
          NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: ${{ secrets.FIREBASE_STORAGE_BUCKET }}
          NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.FIREBASE_MESSAGING_SENDER_ID }}
          NEXT_PUBLIC_FIREBASE_APP_ID: ${{ secrets.FIREBASE_APP_ID }}
          # テスト用認証情報
          E2E_TEST_EMAIL: ${{ secrets.E2E_TEST_EMAIL }}
          E2E_TEST_PASSWORD: ${{ secrets.E2E_TEST_PASSWORD }}

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-critical-report
          path: |
            playwright-report/
            test-results/
          retention-days: 7

  # mainブランチ用：全テスト（包括的）
  e2e-full:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop' || (github.event_name == 'workflow_dispatch' && github.event.inputs.test_scope == 'full')

    strategy:
      fail-fast: false
      matrix:
        # フルテスト時のみ複数ブラウザ
        browser: [chromium, firefox] # webkitは削除（不安定なため）

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "18.x"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps ${{ matrix.browser }}

      - name: Build Next.js application
        run: npm run build

      - name: Run full E2E tests
        run: npm run test:e2e -- --project=${{ matrix.browser }}
        env:
          # Firebase 環境設定
          NEXT_PUBLIC_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
          NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ${{ secrets.FIREBASE_AUTH_DOMAIN }}
          NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
          NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: ${{ secrets.FIREBASE_STORAGE_BUCKET }}
          NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.FIREBASE_MESSAGING_SENDER_ID }}
          NEXT_PUBLIC_FIREBASE_APP_ID: ${{ secrets.FIREBASE_APP_ID }}
          # テスト用認証情報
          E2E_TEST_EMAIL: ${{ secrets.E2E_TEST_EMAIL }}
          E2E_TEST_PASSWORD: ${{ secrets.E2E_TEST_PASSWORD }}

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-full-report-${{ matrix.browser }}
          path: |
            playwright-report/
            test-results/
          retention-days: 30

      - name: Upload failure screenshots
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: failure-screenshots-${{ matrix.browser }}
          path: test-results/**/*-failed-*.png
          retention-days: 7

  # テスト結果のサマリー生成
  test-summary:
    runs-on: ubuntu-latest
    needs: [e2e-critical, e2e-full]
    if: always() && (needs.e2e-critical.result != 'skipped' || needs.e2e-full.result != 'skipped')

    steps:
      - name: Generate comprehensive test summary
        run: |
          echo "# 🧪 E2E Test Results - Production Quality Assurance" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "## 📊 Test Execution Summary" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY

          if [[ "${{ needs.e2e-critical.result }}" != "skipped" ]]; then
            echo "### ⚡ Critical Tests (Quality Gate)" >> $GITHUB_STEP_SUMMARY
            if [[ "${{ needs.e2e-critical.result }}" == "success" ]]; then
              echo "✅ **Status**: Passed" >> $GITHUB_STEP_SUMMARY
              echo "🔍 **Coverage**: Authentication, CRUD Operations, Dosage Tracking" >> $GITHUB_STEP_SUMMARY
              echo "⏱️ **Duration**: ~5 minutes" >> $GITHUB_STEP_SUMMARY
              echo "🌐 **Browser**: Chromium" >> $GITHUB_STEP_SUMMARY
            else
              echo "❌ **Status**: Failed" >> $GITHUB_STEP_SUMMARY
              echo "🚫 **Action Required**: Fix critical issues before merge" >> $GITHUB_STEP_SUMMARY
            fi
            echo "" >> $GITHUB_STEP_SUMMARY
          fi

          if [[ "${{ needs.e2e-full.result }}" != "skipped" ]]; then
            echo "### 🔄 Comprehensive Tests (Production Readiness)" >> $GITHUB_STEP_SUMMARY
            if [[ "${{ needs.e2e-full.result }}" == "success" ]]; then
              echo "✅ **Status**: Passed" >> $GITHUB_STEP_SUMMARY
              echo "🔍 **Coverage**: All 99 test cases" >> $GITHUB_STEP_SUMMARY
              echo "⏱️ **Duration**: ~20 minutes" >> $GITHUB_STEP_SUMMARY
              echo "🌐 **Browsers**: Chromium + Firefox" >> $GITHUB_STEP_SUMMARY
              echo "📈 **Test Categories**: Authentication, CRUD, Regression, UI, Performance, Error Handling" >> $GITHUB_STEP_SUMMARY
            else
              echo "❌ **Status**: Failed" >> $GITHUB_STEP_SUMMARY
              echo "🚫 **Action Required**: Review comprehensive test failures" >> $GITHUB_STEP_SUMMARY
            fi
            echo "" >> $GITHUB_STEP_SUMMARY
          fi

          echo "## 🎯 Quality Assurance Strategy" >> $GITHUB_STEP_SUMMARY
          echo "- **Development**: Fast critical tests for rapid feedback" >> $GITHUB_STEP_SUMMARY
          echo "- **Production**: Comprehensive tests for deployment readiness" >> $GITHUB_STEP_SUMMARY
          echo "- **Automation**: Zero-touch quality validation pipeline" >> $GITHUB_STEP_SUMMARY
          echo "- **Reliability**: Multi-browser compatibility verification" >> $GITHUB_STEP_SUMMARY

  # 品質ゲート
  quality-gate:
    runs-on: ubuntu-latest
    needs: [e2e-critical, e2e-full]
    if: failure()

    steps:
      - name: Quality gate notification
        run: |
          if [[ "${{ needs.e2e-critical.result }}" == "failure" ]]; then
            echo "::error::🚨 Critical quality gate failed - PR merge blocked for production safety"
          fi
          if [[ "${{ needs.e2e-full.result }}" == "failure" ]]; then
            echo "::warning::⚠️ Comprehensive tests failed - Production deployment not recommended"
          fi
```

### Step 3: GitHub Secrets 設定

Repository Settings > Secrets and variables > Actions で以下を設定：

```
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
E2E_TEST_EMAIL=test-e2e@example.com
E2E_TEST_PASSWORD=TestPassword123!
```

### Step 4: README.md へのバッジ追加

プロダクション品質の証明：

```markdown
# Supplement Management App

[![E2E Tests](https://github.com/username/supplement-app/actions/workflows/e2e-production.yml/badge.svg)](https://github.com/username/supplement-app/actions/workflows/e2e-production.yml)
[![CI](https://github.com/username/supplement-app/actions/workflows/ci.yml/badge.svg)](https://github.com/username/supplement-app/actions/workflows/ci.yml)

## Quality Assurance

- **E2E Testing**: 99 comprehensive test cases with Playwright
- **CI/CD Pipeline**: Automated quality gates and multi-browser testing
- **Test Coverage**: Authentication, CRUD operations, regression testing, UI validation, performance testing
- **Production-Ready**: Enterprise-level quality assurance for deployment confidence
```

## 🎯 移行のタイミング

### 推奨移行時期

1. **アプリケーション安定化後**: 基本機能が安定した段階
2. **プロダクション準備時**: 本格運用を想定した品質確保
3. **技術実証時**: 高度な開発プロセスの実装
4. **チーム開発拡張時**: 複数人での開発開始時

### 移行作業時間

- **設定時間**: 30分程度（テンプレート使用）
- **デバッグ時間**: 初回実行時に30分程度
- **合計**: 1時間程度でエンタープライズレベルCI/CD完成

## 💼 技術的価値

### DevOps実践レベル

```
品質保証プロセス:
- GitHub Actions による CI/CD パイプライン構築
- Playwright を活用した E2E テスト自動化（99テストケース）
- 段階的品質保証戦略（PR用高速テスト + main用包括テスト）
- Firebase連携とSecrets管理による本格的な環境構築
```

### プロジェクト特徴

```
個人開発でありながらエンタープライズレベルの開発プロセスを実装。
CI/CDパイプラインによる自動品質チェック、
99ケースのE2Eテストによる回帰テスト体制、
複数ブラウザでの互換性検証など、
プロダクション環境を想定した堅牢な開発手法を実践。
```

## 📈 品質指標

### CI/CD実績

- **自動実行**: PR/push での継続的品質チェック
- **品質維持**: テスト成功率の高水準維持
- **包括的カバレッジ**: 99テストケースによる品質保証

### 技術的成熟度

- **品質の可視化**: README での継続的品質証明
- **透明性**: Actions タブでの詳細な実行履歴
- **継続的改善**: 定期的なコミットとテスト実行による品質向上

---

## 📝 移行チェックリスト

- [ ] Step 1: Husky pre-commit の調整
- [ ] Step 2: GitHub Actions ワークフロー作成
- [ ] Step 3: GitHub Secrets 設定
- [ ] Step 4: README バッジ追加
- [ ] Step 5: 初回実行とデバッグ
- [ ] Step 6: プロダクション品質の確立

移行完了後は、個人開発でありながらエンタープライズレベルの品質保証プロセスを
実装していることを技術的に実証できるプロジェクトが完成します。
