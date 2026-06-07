# API Controller Mock Flow

NestJS BFF の API 追加は、Issue Driven + Test Driven Development で進める。

このフローでは、最初の PR は Controller mock と Swagger/OpenAPI 契約の作成までを対象にする。外部 API 接続や Resource 実装は別 Issue / 別 PR とする。

## 基本原則

- PM が API IF を決め、Issue にする。
- 人間が Issue コメントで IF を補足・修正する。
- エージェントは Issue 本文と最新コメントをもとに Controller mock を作る。
- 実装前に test を書く。
- 完了条件は Swagger/OpenAPI で公開契約が表現できること。
- Controller mock PR では Controller が固定 DTO を返す。
- Service の新規作成・改修はこの PR では行わない。
- Entity は Swagger/OpenAPI に公開しない。

## フロー

1. PM: API IF Issue を作成する。
2. Human: Issue コメントで IF をレビュー・補足する。
3. MockIssueResponder: Issue とコメントを読み、実装可能性を確認する。
4. MockTester: Controller test と OpenAPI e2e test を RED で追加する。
5. MockImplementer: DTO / docs decorator / Controller / controller module wiring を最小実装する。
6. MockTester: test を GREEN にする。
7. MockReviewer: BFF ルールと Swagger ルールを確認する。
8. MockIssueResponder: draft PR を作成し、Issue に PR リンクと実行ログを残す。

## Controller Mock PR のスコープ

含める:

- `src/interface/dto/*.dto.ts`
- `src/docs/*.docs.ts`
- `src/controller/*.controller.ts`
- `src/controller/*.module.ts`
- Controller test
- OpenAPI e2e test

含めない:

- Service の新規作成・改修
- 外部 API 接続
- Resource の本実装
- 認証・認可の詳細
- DB や Provider 連携
- フロント都合だけのレスポンス変更

## 完了条件

- `pnpm lint` が通る。
- `pnpm typecheck` が通る。
- `pnpm test --runInBand` が通る。
- `pnpm build` が通る。
- OpenAPI e2e test で以下を確認している。
  - endpoint が `paths` に含まれる。
  - response schema が DTO を参照している。
  - error response が定義されている。
  - tag / summary / description が定義されている。
  - Entity が `components.schemas` に含まれない。

## PR に書くこと

- 対象 Issue
- 確定した API IF
- 追加した tests
- Swagger/OpenAPI で確認した内容
- 実行コマンドと結果
- mock の制限事項
- 後続 Issue 候補
