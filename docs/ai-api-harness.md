# AI API Harness

このドキュメントは、NestJS BFF で AI エージェントが API を追加するためのハーネス設計を定義する。

## 目的

- PM が API IF を決め、Issue として管理する。
- 人間が Issue コメントで IF をレビュー・補足する。
- AI エージェントは Issue とコメントをもとに Controller mock PR を作成する。
- 開発手法は Test Driven Development を前提とする。
- 完了条件は Swagger/OpenAPI で API 契約が表現できることとする。

## 参照ルール

- `AGENTS.md`
- `docs/bff-code-design-rules.md`
- `docs/swagger-openapi-rules.md`
- `.codex/workflows/api_controller_mock_flow.md`

## エージェント構成

- `pm`: API IF を決定し Issue 化する。
- `issue_responder`: Issue と人間コメントを読み、作業をオーケストレーションする。
- `mock_tester`: API IF を Controller test / OpenAPI e2e test として具体化する。
- `mock_implementer`: failing test を通す最小実装を行う。
- `reviewer`: BFF / Swagger / TDD ルールに適合しているか確認する。

## Issue 駆動フロー

1. PM が API IF Issue を作る。
2. 人間が Issue コメントで仕様を補足・修正する。
3. `issue_responder` が Issue 本文と最新コメントを読み、確定 IF を要約する。
4. IF が不十分な場合は質問コメント案を出して停止する。
5. IF が十分な場合は Controller mock PR を TDD で作る。

## API IF Issue に必要な項目

- API 名
- HTTP method
- path
- path params
- query
- request body
- response DTO
- error response
- Swagger tag
- Swagger summary
- Swagger description
- mock response
- acceptance criteria

## Controller Mock PR の実装範囲

Controller mock PR は、Frontend と API 契約を先に合意するための PR とする。

実装するもの:

- DTO
- Swagger docs decorator
- Controller
- Controller module
- Controller test
- OpenAPI e2e test

実装しないもの:

- Service の新規作成・改修
- 外部 API 接続
- Resource の本実装
- DB 接続
- 認証・認可の詳細
- Provider 固有の error mapping

## レイヤー責務

Controller:

- Controller mock PR では routing と固定 DTO の返却だけを行う。
- `src/docs` の decorator を付与する。
- Service / Resource / Entity / HTTP client を import しない。

Service:

- Controller mock PR では作成・改修しない。
- 本実装 PR で Controller に返す DTO を確定する。
- HTTP client を知らない。

Resource:

- 外部 API 接続 PR で追加する。
- Entity を返す。
- 外部 API error を BFF 内部例外に変換する。

Docs:

- Swagger/OpenAPI operation decorator を置く。
- DTO は import してよい。
- Service / Resource / Entity は import しない。

## TDD 完了条件

Controller mock PR は、最低限以下を満たすこと。

- Controller test が request と mock response を確認している。
- OpenAPI e2e test が endpoint / DTO schema / error response / tag / summary / description を確認している。
- Entity が OpenAPI に公開されていない。
- `pnpm lint` が通る。
- `pnpm typecheck` が通る。
- `pnpm test --runInBand` が通る。
- `pnpm build` が通る。

## PR 作成時の注意

- PR は draft で作る。
- PR 本文に Issue の API IF を転記する。
- 実行した command と結果を記載する。
- mock であること、後続で Resource 実装が必要なことを明記する。
