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

## 実装前に読むこと

NestJS BFF の実装では、以下のルールドキュメントを必ず確認する。

- `docs/bff-code-design-rules.md`
- `docs/layer-boundaries.md`
- `docs/swagger-openapi-rules.md`
- `docs/ai-api-harness.md`

## レイヤー境界

レイヤー境界の正本は `docs/layer-boundaries.md` とする。個別文書へ同じルールを
複製しない。
