# Agent Rules

## 基本方針

このリポジトリは NestJS BFF。API 開発と共通基盤開発は Issue Driven +
Test Driven Development を前提に進める。

- API 完了条件: Swagger/OpenAPI で API 契約を表現できること。
- API 作業: Issue とコメントを読み、Controller mock または実装を draft PR にする。
- 基盤作業: 設定、DI、横断動作、機密情報保護、既存 API 非回帰を test で表現する。

## 必読

NestJS BFF の実装前に読む:

- `docs/bff-code-design-rules.md`
- `docs/swagger-openapi-rules.md`
- `docs/ai-api-harness.md`

作業種別ごとの詳細は必要なものだけ読む:

- API mock: `.codex/workflows/api_controller_mock_flow.md`
- API implementation: `.codex/workflows/api_implementation_flow.md`
- Foundation: `.codex/workflows/foundation_implementation_flow.md`
- Agent roles: `.codex/agents/*.toml`

## CodeGraph

`.codegraph/` がある場合、コード理解・探索では grep/find や手読みより先に
CodeGraph を使う。

- 広い調査や流れ: `codegraph_explore`
- 単一 symbol/file: `codegraph_node`
- MCP がない場合: `codegraph explore "<question>"` / `codegraph node <target>`

## Shell

`rtk` が使える環境では shell command に prefix する。`rtk` が無い場合や raw
output が必要なデバッグ時は通常コマンドでよい。

## Memory

タスク終了時、後で役立つ情報だけ agent-memory に保存する。

- `long_term`: 設計判断、運用方針、プロジェクト固有の決定
- `daily`: 実装メモ、調査結果、作業ログ
- `scratchpad`: 未完了 TODO

秘密情報、トークン、パスワード、認証情報、個人情報は保存しない。

ユーザーが「前回の続き」「再開」「続きから」「思い出して」と依頼したら、
作業前に scratchpad、直近日付の daily、関連 long_term を確認し、以下を短く報告する。

- 前回やっていたこと:
- 未完了 TODO:
- 今回最初にやること:
