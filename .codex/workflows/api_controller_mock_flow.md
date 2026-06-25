# API Controller Mock Flow

NestJS BFF の API 追加は、Issue Driven + Test Driven Development で進める。

このフローでは、最初の PR は Controller mock と Swagger/OpenAPI 契約の作成までを対象にする。外部 API 接続や Resource 実装は別 Issue / 別 PR とする。

## 必須参照

- レイヤー境界の正本 `docs/layer-boundaries.md` を実装・テスト・レビュー前に読む。

## 基本原則

- mock flow は `mock_tester -> mock_implementer -> mock_reviewer` の順に進める。途中工程を省略した場合は完了扱いにしない。
- mock_reviewer のレビューが未実施の場合、テストが通っていても「レビュー未完了」と明記する。
- サブエージェントに委譲した作業と同じ Controller mock 実装を親エージェントが並行して進めない。重複作業は token 浪費と差分衝突の原因になる。
- サブエージェントが長時間 running のまま完了しない場合でも、ユーザー確認なしに close/shutdown しない。
- close/shutdown を検討する時は、待機時間、最後に観測できた状態、終了しない理由として断定できる事実、不明点、継続/停止/親側引き継ぎの選択肢をユーザーへ説明する。
- `previous_status: "running"` の agent を閉じた場合、終了理由は「親が close_agent したため」であり、サブエージェント内部エラーと断定しない。
- 単純な Controller mock では丸投げを避け、Issue 要約、テスト作成、実装、レビューのように小さく具体的な依頼へ分ける。

- PM が API IF を決め、Issue にする。
- 人間が Issue コメントで IF を補足・修正する。
- エージェントは Issue 本文と最新コメントをもとに Controller mock を作る。
- 実装前に test を書く。
- 完了条件は Swagger/OpenAPI で公開契約が表現できること。
- Controller mock PR では Controller が対応する Service を呼び、Service が固定 DTO を返す。
- Controller と 1対1 の対応 Service を作成し、固定 DTO は Service から返す。
- Entity は Swagger/OpenAPI に公開しない。

## フロー

1. PM: API IF Issue を作成する。
2. Human: Issue コメントで IF をレビュー・補足する。
3. MockIssueResponder: Issue とコメントを読み、実装可能性を確認する。
4. MockTester: Controller test と OpenAPI e2e test を RED で追加する。
5. MockImplementer: DTO / docs decorator / Controller / 対応 Service / controller module wiring を最小実装する。
6. MockTester: test を GREEN にする。
7. MockReviewer: BFF ルールと Swagger ルールを確認する。
8. MockIssueResponder: draft PR を作成し、Issue に PR リンクと実行ログを残す。

## Controller Mock PR のスコープ

含める:

- `src/dto/*.dto.ts`
- `src/docs/*.docs.ts`
- `src/controller/*.controller.ts`
- `src/service/*.service.ts`
- `src/controller/*.module.ts`
- Controller test
- OpenAPI e2e test

含めない:

- 対応 Service 以外の Service の新規作成・改修
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
