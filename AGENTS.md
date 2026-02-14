# AGENTS.md

このファイルは、このリポジトリで作業するAIエージェント向けの運用基準です。
既存ドキュメントを優先し、未合意の独自運用を追加しないこと。

## 1. 保存場所と参照順

- 本ファイルの正規保存場所はリポジトリ直下: `AGENTS.md`
- 作業前後は以下を優先順で参照する。

1. `.cursor/docs/uiux-improvement-log.md`
2. `.cursor/docs/refactoring-checklist.md`
3. `.cursor/docs/e2e-test-integration-checklist.md`
4. `.cursor/docs/functional-test-checklist.md`
5. `.cursor/docs/directorystructure.md`
6. `.cursor/docs/technologystack.md`
7. `.cursor/docs/netlify-deployment-guide.md`
8. `.cursor/docs/cursor-submodule-management.md`
9. `README.md`

補足:

- `docs/uiux-improvement-log.md` は移管案内用。正本は `.cursor/docs/uiux-improvement-log.md`。
- `memory_bank/*.md` は補助資料。正本ドキュメントと矛盾したら正本を優先。

## 2. タスク完了時の必須更新

UI/UX・機能・運用に関わる変更を行ったら、同ターンで必ずドキュメントも更新する。

- `.cursor/docs/uiux-improvement-log.md`
  - チェックリストを更新（完了は `[x]`）
  - ブレスト中で確定した項目はチェックリストへ移動
  - 実装済みが「未確定/ブレスト中」に残っていたら削除
  - 実装ログは必ず「新しいものを上、古いものを下」
- リファクタ関連の変更時は `.cursor/docs/refactoring-checklist.md` も更新
- E2E/テスト基盤変更時は `.cursor/docs/e2e-test-integration-checklist.md` も更新

## 3. 実装・進行ルール

- ユーザーの直近指示を最優先する。未依頼の別タスクに逸れない。
- 既存UIとの統一感を維持する（サイズ、余白、文言トーン、操作導線）。
- 高リスク変更（認証、Firebaseルール、データ整合性）は根拠を確認してから実施する。
- 設定系は `src/lib/firebaseClient.ts` 一元管理方針を守る。

## 4. コミット運用

- コミットは機能単位で分割する。
- 1コミット1目的を原則とし、UI変更・データ仕様変更・ドキュメント更新を必要に応じて分離する。
- 未コミット差分が混在している場合は、差分を整理してから提案・実施する。

## 5. 重複ドキュメント方針

- 運用記録の正本は `.cursor/docs/*` に統合する。
- 役割が重複するファイルは片方を案内用にし、正本へのリンクを明記する。
