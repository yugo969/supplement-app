# AGENTS.md

このファイルは、このリポジトリで作業するAIエージェント向けの運用基準です。
既存ドキュメントを優先し、未合意の独自運用を追加しないこと。

## 1. 保存場所と参照順

- 本ファイルの正規保存場所はリポジトリ直下: `AGENTS.md`
- 作業前後は以下を優先順で参照する。

1. `.cursor/docs/project-overview.yaml`
2. `.cursor/docs/uiux-improvement-log.md`
3. `.cursor/docs/refactoring-checklist.md`
4. `.cursor/docs/e2e-test-integration-checklist.md`
5. `.cursor/docs/functional-test-checklist.md`
6. `.cursor/docs/directorystructure.md`
7. `.cursor/docs/technologystack.md`
8. `.cursor/docs/netlify-deployment-guide.md`
9. `.cursor/docs/cursor-submodule-management.md`
10. `README.md`

補足:
- `docs/uiux-improvement-log.md` は移管案内用。正本は `.cursor/docs/uiux-improvement-log.md`。
- `memory_bank/*.md` は補助資料。正本ドキュメントと矛盾したら正本を優先。

## 2. 変更前提ルール

- 未指示の変更は行わない。必要な追加変更は提案し、合意後に実施する。
- UI/UX変更（レイアウト・色・フォント・間隔・操作導線）は、事前合意を得てから実施する。
- 技術スタックのバージョンは勝手に変更しない。必要時は理由を示して合意を得る。

## 3. タスク完了時の必須更新

UI/UX・機能・運用に関わる変更を行ったら、同ターンで必ずドキュメントも更新する。

- `.cursor/docs/uiux-improvement-log.md`
  - チェックリストを更新（完了は `[x]`）
  - ブレスト中で確定した項目はチェックリストへ移動
  - 実装済みが「未確定/ブレスト中」に残っていたら削除
  - 実装ログは必ず「新しいものを上、古いものを下」
- リファクタ関連の変更時は `.cursor/docs/refactoring-checklist.md` も更新
- E2E/テスト基盤変更時は `.cursor/docs/e2e-test-integration-checklist.md` も更新
- コード変更後は `.cursor/docs/project-overview.yaml` の更新要否を確認し、必要なら反映する

## 4. 実装・進行ルール

- ユーザーの直近指示を最優先する。未依頼の別タスクに逸れない。
- 既存UIとの統一感を維持する（サイズ、余白、文言トーン、操作導線）。
- 高リスク変更（認証、Firebaseルール、データ整合性）は根拠を確認してから実施する。
- 設定系は `src/lib/firebaseClient.ts` 一元管理方針を守る。
- データ構造/権限モデル変更時は、`firestore.rules` とアプリ実装の整合を必ず確認する。
- Firebaseの権限はサーバールールに加えて、クライアント側でも対象データ所有チェックを行う。

## 5. 実装後レビュー参照

- 実装後セルフレビューの詳細項目は `.cursor/docs/uiux-improvement-log.md` の「反映メモ（運用）」を正本として参照する。

## 6. コーディング要点

- ディレクトリ責務を守る（`src/pages`, `src/components`, `src/hooks`, `src/lib`, `src/schemas` など）。
- バリデーションスキーマは `src/schemas` に集約し、型はスキーマ由来を優先する。
- 外部データ取り込み時は `src/lib/type-guards.ts` などで型安全な変換を通す。
- スタイル実装は Tailwind CSS を原則とし、インライン `style` は Tailwind で表現不能な場合のみ使用する。
- インライン `style` を使った場合は、理由を明示し、Tailwind へ戻せるなら残タスク化する。
- CSSでベンダープレフィックスを使う場合は、対応する標準プロパティを必ず併記する。

## 7. コミット運用

- コミットは機能単位で分割する。
- 1コミット1目的を原則とし、UI変更・データ仕様変更・ドキュメント更新を必要に応じて分離する。
- 未コミット差分が混在している場合は、差分を整理してから提案・実施する。
- コミット前に最低限 `npm run type-check` を実行する。

## 8. 重複ドキュメント方針

- 運用記録の正本は `.cursor/docs/*` に統合する。
- 役割が重複するファイルは片方を案内用にし、正本へのリンクを明記する。

## 9. Gemini PR前レビュー（必須）

- コード変更があるターンでは、最終回答前に Gemini CLI で差分レビューを必ず実行する。
- レビュー手順は `gemini-pr-review` Skill を使用する（`$CODEX_HOME/skills/gemini-pr-review/SKILL.md` を参照）。
- 最低限 `git diff --no-color` を Gemini に渡し、High/Medium/Low の指摘を確認する。
- High 指摘がある場合は、修正してから最終回答するか、未対応理由を明記して報告する。
