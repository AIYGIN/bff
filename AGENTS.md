# 全体のルール定義

## 概要

本プロジェクトは NestJS BFF の API 開発において、Issue Driven + Test Driven Development を前提とする。

- PM が必要な API の IF を決定し、Issue にする
- 人間が Issue コメントで IF を補足・修正する
- AI エージェントは Issue とコメントをもとに Controller mock を生成し、draft PR にする
- 完了条件は Swagger/OpenAPI で API 契約を表現できること

詳細は以下を参照する。

- `docs/ai-api-harness.md`
- `.codex/workflows/api_controller_mock_flow.md`
- `.codex/agents/*.toml`

## 実装前に読むこと

NestJS BFF の実装では、以下のルールドキュメントを必ず確認する。

- `docs/bff-code-design-rules.md`
- `docs/swagger-openapi-rules.md`
- `docs/ai-api-harness.md`