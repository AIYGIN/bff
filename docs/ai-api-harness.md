# AI API Harness

このドキュメントは、NestJS BFF で AI エージェントが API を追加するためのハーネス設計を定義する。

## 目的

- PM が API IF を決め、Issue として管理する。
- 人間が Issue コメントで IF をレビュー・補足する。
- AI エージェントは Issue とコメントをもとに Controller mock PR と本実装 PR を作成する。
- 開発手法は Test Driven Development を前提とする。
- Controller mock の完了条件は Swagger/OpenAPI で API 契約が表現できることとする。
- 本実装の完了条件は、合意済み API 契約を維持したうえで Service / Resource を TDD で実装することとする。

## 参照ルール

- `AGENTS.md`
- `docs/bff-code-design-rules.md`
- `docs/swagger-openapi-rules.md`
- `.codex/workflows/api_controller_mock_flow.md`
- `.codex/workflows/api_implementation_flow.md`

## エージェント構成

- `pm`: API IF を決定し Issue 化する。
- `mock_issue_responder`: Issue と人間コメントを読み、作業をオーケストレーションする。
- `mock_tester`: API IF を Controller test / OpenAPI e2e test として具体化する。
- `mock_implementer`: failing test を通す最小実装を行う。
- `implementation_planner`: Controller mock PR と API IF をもとに本実装計画を Issue 化する。
- `implementation_issue_responder`: 本実装 Issue と人間コメントを読み、TDD 実装 PR 作成までを進行する。
- `implementation_tester`: 本実装 Issue を unit / integration / e2e test として具体化する。
- `implementation_implementer`: failing test を通す本実装を行う。
- `implementation_reviewer`: 本実装 PR が BFF / Swagger / TDD ルールに適合しているか確認する。
- `mock_reviewer`: Controller mock PR を中心に BFF / Swagger / TDD ルールに適合しているか確認する。

## Mock Issue 駆動フロー

1. PM が API IF Issue を作る。
2. 人間が Issue コメントで仕様を補足・修正する。
3. `mock_issue_responder` が Issue 本文と最新コメントを読み、確定 IF を要約する。
4. IF が不十分な場合は質問コメント案を出して停止する。
5. IF が十分な場合は Controller mock PR を TDD で作る。

## 本実装 Issue 駆動フロー

1. Controller mock PR で Swagger/OpenAPI の API 契約を合意する。
2. `implementation_planner` が API IF、Controller mock PR、Issue コメントを読み、本実装計画 Issue を作る。
3. 人間が本実装計画 Issue をレビュー・補足する。
4. `implementation_issue_responder` が Issue 本文と最新コメントを読み、実装可能性を確認する。
5. 実装計画が不十分な場合は質問コメント案を出して停止する。
6. 実装計画が十分な場合は本実装 PR を TDD で作る。

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
- 本実装 PR では外部 API request / response を Resource に閉じ込める。

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

本実装 PR は、最低限以下を満たすこと。

- Controller が Service 呼び出しだけを行っている。
- Service が DTO / primitive value を受け取り、DTO を返している。
- Resource が Entity を返し、DTO / Swagger / Controller を import していない。
- 外部 API request / response / error mapping が Resource に閉じている。
- Controller test / Service unit test / Resource unit test / 必要な e2e test が追加・更新されている。
- mock の固定レスポンスが本実装に置き換わっている。
- API 契約の変更がある場合、OpenAPI e2e test と Issue に理由が残っている。
- `pnpm lint` が通る。
- `pnpm typecheck` が通る。
- `pnpm test --runInBand` が通る。
- `pnpm build` が通る。

## PR 作成時の注意

- PR は draft で作る。
- PR 本文に Issue の API IF を転記する。
- 実行した command と結果を記載する。
- mock であること、後続で Resource 実装が必要なことを明記する。
- 本実装 PR では、実装計画 Issue、RED/GREEN の記録、外部 API / Resource / Service の設計判断を記載する。
