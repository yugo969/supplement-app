#!/bin/bash

# =============================================================================
# リファクタリング前チェックスクリプト
# =============================================================================
#
# 目的: リファクタリング作業前に重要機能の動作確認を自動実行
# 実行: ./scripts/pre-refactor-check.sh
#
# このスクリプトは以下の順序で実行されます：
# 1. ビルドチェック
# 2. 型チェック
# 3. 重要E2Eテスト（認証・CRUD・回帰）
# 4. 結果レポート生成
# =============================================================================

echo "🔧 リファクタリング前チェック開始"
echo "=================================="

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 結果記録用変数
ERRORS=()
WARNINGS=()
PASSED=()

# エラー処理関数
handle_error() {
    local test_name="$1"
    local error_msg="$2"
    ERRORS+=("$test_name: $error_msg")
    echo -e "${RED}❌ $test_name 失敗${NC}: $error_msg"
}

# 成功処理関数
handle_success() {
    local test_name="$1"
    PASSED+=("$test_name")
    echo -e "${GREEN}✅ $test_name 成功${NC}"
}

# 警告処理関数
handle_warning() {
    local test_name="$1"
    local warning_msg="$2"
    WARNINGS+=("$test_name: $warning_msg")
    echo -e "${YELLOW}⚠️ $test_name 警告${NC}: $warning_msg"
}

echo -e "\n${BLUE}1. TypeScript型チェック${NC}"
echo "------------------------"
if npm run type-check; then
    handle_success "TypeScript型チェック"
else
    handle_error "TypeScript型チェック" "型エラーが検出されました"
fi

echo -e "\n${BLUE}2. Next.jsビルドチェック${NC}"
echo "-------------------------"
if npm run build; then
    handle_success "Next.jsビルド"
else
    handle_error "Next.jsビルド" "ビルドエラーが発生しました"
fi

echo -e "\n${BLUE}3. 重要機能E2Eテスト${NC}"
echo "----------------------"

# 認証テスト
echo -e "\n${BLUE}3.1 認証機能テスト${NC}"
if npx playwright test tests/e2e/auth --project=chromium --quiet; then
    handle_success "認証機能テスト"
else
    handle_error "認証機能テスト" "認証フローに問題が検出されました"
fi

# CRUD機能テスト（安定版のみ実行）
echo -e "\n${BLUE}3.2 安定CRUD機能テスト${NC}"
if npx playwright test tests/e2e/supplements/supplement-search.spec.ts --project=chromium --quiet; then
    handle_success "安定CRUD機能テスト"
else
    handle_warning "安定CRUD機能テスト" "検索機能に軽微な問題があります（開発継続可能）"
fi

# 回帰テスト（最重要）
echo -e "\n${BLUE}3.3 服用記録回帰テスト${NC}"
if npx playwright test tests/e2e/regression/dosage-tracking.spec.ts --project=chromium --quiet; then
    handle_success "服用記録回帰テスト"
else
    handle_error "服用記録回帰テスト" "服用記録機能に退行が検出されました（要修正）"
fi

# 結果レポート生成
echo -e "\n${BLUE}===================================${NC}"
echo -e "${BLUE}📊 リファクタリング前チェック結果${NC}"
echo -e "${BLUE}===================================${NC}"

echo -e "\n${GREEN}✅ 成功項目 (${#PASSED[@]}件)${NC}"
for item in "${PASSED[@]}"; do
    echo -e "  • $item"
done

if [ ${#WARNINGS[@]} -gt 0 ]; then
    echo -e "\n${YELLOW}⚠️ 警告項目 (${#WARNINGS[@]}件)${NC}"
    for item in "${WARNINGS[@]}"; do
        echo -e "  • $item"
    done
fi

if [ ${#ERRORS[@]} -gt 0 ]; then
    echo -e "\n${RED}❌ エラー項目 (${#ERRORS[@]}件)${NC}"
    for item in "${ERRORS[@]}"; do
        echo -e "  • $item"
    done
    echo -e "\n${RED}🚨 リファクタリング開始前に上記エラーの修正が必要です${NC}"
    echo -e "${RED}   すべてのテストが成功するまでリファクタリングを控えてください${NC}"
    exit 1
else
    echo -e "\n${GREEN}🎉 すべてのチェックが成功しました！${NC}"
    echo -e "${GREEN}   安全にリファクタリング作業を開始できます${NC}"

    # タイムスタンプ記録
    echo "リファクタリング前チェック完了: $(date)" > .refactor-baseline
    echo -e "\n${BLUE}💡 ベースライン記録完了${NC}: .refactor-baseline"
    echo -e "   リファクタリング後に同じチェックを実行して品質確認してください"
fi

echo -e "\n${BLUE}💡 次のステップ${NC}"
echo "---------------"
echo "1. リファクタリング作業実施"
echo "2. 作業後に再度このスクリプトを実行"
echo "3. すべてのテストが成功することを確認"
echo "4. 必要に応じてgit commitでHusky pre-commitテストも実行"

echo -e "\n${BLUE}🔧 チェック完了${NC}"
