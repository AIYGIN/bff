# 全体のルール定義

## 概要

本プロジェクトは NestJS BFF の API 開発と共通基盤開発において、
Issue Driven + Test Driven Development を前提とする。

- PM が必要な API の IF を決定し、Issue にする
- 人間が Issue コメントで IF を補足・修正する
- AI エージェントは Issue とコメントをもとに Controller mock を生成し、draft PR にする
- 完了条件は Swagger/OpenAPI で API 契約を表現できること
- 基盤 Issue は専用エージェントが設定、DI、横断動作、機密情報保護、
  既存 API 非回帰を test で表現し、draft PR にする

詳細は以下を参照する。

- `docs/ai-api-harness.md`
- `.codex/workflows/api_controller_mock_flow.md`
- `.codex/workflows/api_implementation_flow.md`
- `.codex/workflows/foundation_implementation_flow.md`
- `.codex/agents/*.toml`

## Memory rule

各タスクの最後に、必要に応じて今回の作業内容を要約し、agent-memory を更新する。

- 長期的に残すべき設計判断・運用方針・プロジェクト固有の決定事項は long_term に保存する。
- 今日の実装メモ・調査内容・作業ログは daily に保存する。
- 次回以降に対応する未完了タスクや TODO は scratchpad に保存する。
- 秘密情報、API トークン、パスワード、認証情報、個人情報は保存しない。
- 明らかに一時的な情報や、後から役に立たない雑多なログは保存しない。

使用コマンド:

- `agent-memory write --target daily --content "..."`
- `agent-memory write --target long_term --content "..."`
- `agent-memory scratchpad add --text "..."`

## Session start rule

セッション開始時、ユーザーから「前回の続き」「再開」「続きから」「思い出して」などの指示があった場合は、作業前に必ず agent-memory を確認する。

確認対象:

1. scratchpad の未完了 TODO
2. daily の直近日付ログ
3. long_term の関連する設計判断

確認後、以下の形式でユーザーに短く報告する。

- 前回やっていたこと:
- 未完了 TODO:
- 今回最初にやること:

## 実装前に読むこと

NestJS BFF の実装では、以下のルールドキュメントを必ず確認する。

- `docs/bff-code-design-rules.md`
- `docs/swagger-openapi-rules.md`
- `docs/ai-api-harness.md`
