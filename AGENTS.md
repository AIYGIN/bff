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
- `docs/swagger-openapi-rules.md`
- `docs/ai-api-harness.md`

## レイヤー境界

- Controller と Service は 1対1 にする。
- Controller は対応する Service だけを inject する。
- Controller は複数 Service、helper service、Resource、Entity、HttpService を扱わない。
- 依存方向は `Controller -> Service -> Resource -> External API` とする。
- Resource は Entity を返し、DTO を返さない。
- Service は Entity -> DTO 変換を担当する。
- Entity は Swagger/OpenAPI に公開しない。
- DI 不要な helper は service class にせず `src/utility/` の純粋関数にする。
- Auth の jwt-token / oauth-state / opaque-subject / cookie helper は utility に置く。
- `src/provider/` と `src/module/` は作らない。
- `*.module.ts` は責務を持つ Controller、Service、Resource、Guard、common 基盤の近くに置く。
