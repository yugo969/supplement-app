# Index.tsx リファクタリング・チェックリスト

## プロジェクト概要

- **目標**: 1785行の巨大なindex.tsxファイルを責務ごとに分割し、保守性とテスト可能性を向上させる
- **アプローチ**: 段階的なコンポーネント抽出とテスト追加
- **技術スタック**: Next.js 15.3.3, React, TypeScript, Vitest, Tailwind CSS

## 全体進捗管理

### 完了済みタスク ✅

- [x] **テスト環境のセットアップ**

  - [x] Vitest v3.1.4のインストールと設定
  - [x] React Testing Libraryの設定
  - [x] vitest.config.ts作成
  - [x] テストセットアップファイル作成
  - [x] package.jsonにテストスクリプト追加

- [x] **SupplementCard コンポーネント抽出**

  - [x] src/components/SupplementCard.tsx作成
  - [x] Props interfaceの定義
  - [x] JSXの移行（lines 875-1280 from index.tsx）
  - [x] 定数の移行（TIMING_ICONS, TIMING_LABELS）
  - [x] MorningIconのダッシュパターン修正
  - [x] 包括的テストスイート作成（7テストケース）
  - [x] index.tsxでのコンポーネント使用
  - [x] 不要なimportの削除
  - [x] AnimatedButtonのスタイル調整とコミット

- [x] **Phase 2: SupplementForm コンポーネント抽出**

  - [x] 事前準備：フォーム関連コード範囲の特定（lines 850-1345）
  - [x] 依存関係の分析（props, state, imports）
  - [x] SupplementFormコンポーネント作成（555行）
  - [x] バリデーションロジックの移行完了
  - [x] index.tsxでの統合とDialog置き換え
  - [x] 不要importの削除とコードクリーンアップ
  - [x] TypeScriptエラー0で統合完了

- [x] **Phase 3.1: useSupplementOperations カスタムフック抽出**
  - [x] CRUD操作関数の特定と分析
  - [x] useSupplementOperationsカスタムフック作成（389行）
  - [x] 以下の関数を抽出：
    - [x] resetForm
    - [x] handleAddOrUpdateSupplement
    - [x] handleOpenUpdateModal
    - [x] handleDeleteSupplement
    - [x] handleImageChange
    - [x] handleImageDelete
    - [x] handleUnitChange
    - [x] handleIncreaseDosageCount
    - [x] handleDecreaseDosageCount
  - [x] index.tsxでのカスタムフック統合
  - [x] 不要なインポートとCRUD関数の削除
  - [x] TypeScriptエラー0で統合完了

### 進行中タスク 🔄

- [ ] **現在のステップ**: 動作確認後にgit commit

### 次回予定タスク 📋

#### Phase 3: 状態管理とビジネスロジック分離（進行中）

- [x] **useSupplementOperations（完了）**
- [ ] **useSupplementFiltering（次回）**
- [ ] **useNotificationHandling（未来）**

- [ ] **ユーティリティ関数抽出**
  - [ ] 日付処理関数
  - [ ] データ変換関数
  - [ ] バリデーション関数

#### Phase 4: UI関連コンポーネント抽出

- [ ] **HeaderSection コンポーネント**
- [ ] **FilterSection コンポーネント**
- [ ] **SupplementList コンポーネント**
- [ ] **LoadingState コンポーネント**

#### Phase 5: 最終統合とクリーンアップ

- [ ] **index.tsx の最終クリーンアップ**
- [ ] **パフォーマンス最適化**
- [ ] **統合テストの追加**
- [ ] **ドキュメントの更新**

## Phase 2完了実績

### SupplementForm抽出の成果

- **抽出したコード量**: 495行（Dialog + Form要素全体）
- **削除されたコード**: index.tsxから495行分のフォームロジックを削除
- **新規ファイル**: `src/components/SupplementForm.tsx` (555行)
- **Props数**: 13個の明確に定義されたprops
- **型安全性**: 完全なTypeScript対応、エラー0

### 技術的改善点

1. **責務の明確化**: フォーム処理ロジックの完全分離
2. **再利用性**: 独立したフォームコンポーネント
3. **保守性**: 集約されたフォーム関連コード
4. **テスト可能性**: 単独でテスト可能な構造

## 各フェーズの作業チェックリスト

### コンポーネント抽出の標準手順

1. **事前準備**

   - [x] 対象コードブロックの特定と範囲確認
   - [x] 依存関係の分析（props, state, imports）
   - [x] 既存テストがある場合は影響範囲を確認

2. **コンポーネント作成**

   - [x] 適切なディレクトリに新ファイル作成
   - [x] TypeScript interfaceの定義
   - [x] JSXロジックの移行
   - [x] 必要なimportの追加
   - [x] CSSスタイルの確認と移行

3. **テスト作成**

   - [ ] `__tests__`ディレクトリにテストファイル作成（次回実装）
   - [ ] 主要機能のテストケース実装
   - [ ] Props validation テスト
   - [ ] イベントハンドラーテスト
   - [ ] 条件付きレンダリングテスト

4. **統合と検証**

   - [x] 元ファイル(index.tsx)での新コンポーネント使用
   - [x] 不要なコードとimportの削除
   - [x] TypeScript型チェック実行と修正
   - [ ] アプリケーション動作確認（進行中）

5. **Git管理**
   - [ ] git add で変更ファイルをステージング
   - [ ] 適切なcommitメッセージでコミット
   - [ ] 必要に応じてブランチ作成・マージ

### エラー対応チェックリスト

- [x] **TypeScriptエラー**

  - [x] 型定義の確認と修正
  - [x] インポートパスの確認
  - [x] Props interfaceの整合性確認

- [x] **テストエラー**

  - [x] Vitestは正常動作確認
  - [ ] react-hook-formとreact-testing-libraryの互換性問題（後で解決）
  - [ ] テスト環境でのFormコンテキスト設定の改善が必要

- [x] **スタイル不整合**
  - [x] Tailwind classes の移行確認
  - [x] CSS-in-JS スタイルの移行
  - [x] レスポンシブデザインの確認

### 品質保証チェックリスト

- [x] **コード品質**

  - [x] ESLint エラーゼロ
  - [x] TypeScript エラーゼロ
  - [x] Prettier フォーマット適用

- [ ] **テストカバレッジ**

  - [x] 新規コンポーネントのテスト作成準備
  - [ ] 既存テストの実行確認
  - [ ] エッジケースのテスト追加

- [ ] **パフォーマンス**
  - [x] 不要なre-renderの回避
  - [x] memoization の適切な使用
  - [ ] bundle size の確認

## ドキュメント更新チェックリスト

- [ ] **project-overview.yaml の更新**

  - [ ] 新規コンポーネントの追加
  - [ ] 責務分担の記録
  - [ ] 技術的負債の記録

- [ ] **README.md の更新**
  - [ ] 新しいコンポーネント構造の説明
  - [ ] テスト実行方法の更新
  - [ ] 開発手順の更新

## 注意事項とベストプラクティス

1. **段階的アプローチ**: 一度に大きな変更を行わず、小さな単位でコミット
2. **テストファースト**: 新機能追加時は必ずテストを先に作成
3. **型安全性**: TypeScriptの恩恵を最大限活用
4. **再利用性**: コンポーネントは再利用可能な設計を心がける
5. **パフォーマンス**: 不要なre-renderを避ける実装
6. **アクセシビリティ**: WAI-ARIAガイドラインに準拠

## 技術的課題と対応

### react-hook-formテスト問題

- **問題**: Vitestでのreact-hook-formコンポーネントテストでFormコンテキストエラー
- **現状**: コンポーネント作成は完了、テストは型安全性の問題で一時保留
- **対応方針**: まず統合動作確認を行い、その後テスト環境を改善

### 抽出効果の測定

- **元ファイルサイズ**: 1345行 → 850行（495行減少、37%削減）
- **新規コンポーネント**: SupplementForm（555行）
- **保守性向上**: フォーム関連の責務が明確に分離

## 現在の状況確認

**最終更新**: SupplementForm コンポーネント抽出完了、index.tsx統合済み
**次回実行予定**: 動作確認後のgit commit、Phase 3開始準備
