# API Implementation Flow

NestJS BFF の本実装は、Controller mock PR で合意した Swagger/OpenAPI 契約を起点に、Issue Driven + Test Driven Development で進める。

このフローでは、Controller mock で固定 DTO を返していた endpoint を、Service / Resource / Entity / 外部 API 接続を含む本実装へ置き換える。API 契約の変更が必要な場合は、Issue コメントで理由と差分を明確にする。

## 必須参照

- レイヤー境界の正本 `docs/layer-boundaries.md` を実装・テスト・レビュー前に読む。

## 基本原則

- Controller mock PR で API 契約が合意済みであることを前提にする。
- 本実装前に `implementation_planner` が実装計画 Issue を作る。
- 人間が Issue コメントで実装計画をレビュー・補足する。
- エージェントは Issue 本文と最新コメントをもとに実装する。
- 実装前に test を書く。
- Controller は Service 呼び出しだけを担当する。
- Service は DTO / primitive value を受け取り、DTO を返す。
- Resource は外部 API 接続を担当し、Entity を返す。
- Entity は Swagger/OpenAPI に公開しない。

## フロー

1. ImplementationPlanner: API IF Issue、Controller mock PR、関連コメントを読み、本実装計画 Issue を作成する。
2. Human: 本実装計画 Issue をレビュー・補足する。
3. ImplementationIssueResponder: Issue とコメントを読み、実装可能性を確認する。
4. ImplementationTester: Service / Resource / Controller / e2e の必要な failing test を RED で追加する。
5. ImplementationImplementer: Service / Resource / Entity / module wiring / Controller 修正を最小実装する。
6. ImplementationTester: test を GREEN にする。
7. ImplementationReviewer: BFF ルール、Swagger ルール、TDD 記録、Issue との一致を確認する。
8. ImplementationIssueResponder: draft PR を作成し、Issue に PR リンクと実行ログを残す。

## 本実装計画 Issue に必要な項目

- 対象 API IF Issue
- 対象 Controller mock PR
- 実装対象 endpoint
- Controller の変更方針
- Service の責務と public method
- Resource の責務と外部 API endpoint
- Entity / DTO 変換方針
- 外部 API request / response / error mapping
- 認証・認可・header・timeout・retry の扱い
- 追加・更新する test
- API 契約変更の有無
- acceptance criteria

## 本実装 PR のスコープ

含める:

- `src/controller/*.controller.ts`
- `src/service/*.service.ts`
- `src/resource/*.resource.ts`
- `src/dto/*.dto.ts`
- `src/entity/*.entity.ts`
- module wiring
- Controller test
- Service unit test
- Resource unit test
- 必要な OpenAPI e2e test / endpoint e2e test

必要な場合のみ含める:

- `src/docs/*.docs.ts`
- 共通 error / filter / guard / interceptor
- HTTP client adapter 設定

含めない:

- Issue にない API 契約変更
- Frontend 都合だけの response 変更
- 複数 Issue にまたがる大きな Resource 統合
- Provider 固有仕様を DTO に漏らす変更

## TDD 完了条件

- RED の状態で failing test が確認されている。
- GREEN の状態で対象 test が通っている。
- `pnpm lint` が通る。
- `pnpm typecheck` が通る。
- `pnpm test --runInBand` が通る。
- `pnpm build` が通る。
- 必要に応じて `pnpm test:e2e --runInBand` が通る。
- Controller が Resource / Entity / HTTP client を import していない。
- Service が HTTP client / Swagger decorator を import していない。
- Resource が DTO / Controller / Service / Swagger decorator を import していない。
- Entity が OpenAPI `components.schemas` に含まれていない。
- mock の固定レスポンスが本実装に置き換わっている。

## PR に書くこと

- 対象の本実装計画 Issue
- 対象の API IF Issue / Controller mock PR
- 実装した Service / Resource / Entity の責務
- DTO / Entity 変換方針
- 外部 API error mapping
- 追加・更新した tests
- RED/GREEN の実行ログ
- 実行コマンドと結果
- API 契約変更の有無と理由
- 残課題 / 後続 Issue 候補

## Context Packet handoff

親エージェントは planner、implementer、reviewer などのサブエージェントを起動する前に
`docs/ai-api-harness.md` の Context Packet を作成する。

- `Confirmed Requirements` には Controller mock PR で合意済みの OpenAPI 契約、Issue 本文、最新コメント、関連 diff、関連 docs から確定した実装要件だけを入れる。
- `Must Read Files` は原則最大8個にし、対象 Controller、DTO、Service、Resource、既存 test、関連 rules など本実装に必要な最小限に絞る。8個を超える場合は、理由を `Known Risks` または `Assumptions` に明記する。
- `Optional Files` は最大5個にし、類似 API や補助 docs など判断に必要な場合だけ読む対象にする。
- サブエージェントには open-ended な repo 全体探索を依頼しない。ただし、layer-boundary、OpenAPI schema exposure、security redaction、module wiring、既存 API 非回帰の確認に必要な場合は、目的・検索範囲・使用コマンドを明示した限定的 repo-wide search を許可する。
- Context Packet にない仕様追加、OpenAPI 契約変更、Entity の公開はさせない。
- 同じ実装を親エージェントと子エージェント、または複数子エージェントで並行実施しない。
- security/privacy、auth/authorization、API contract/response compatibility、data loss、destructive migration、external provider contract、financial calculation semantics、logging of sensitive data、Cookie/JWT/CORS、public API response の変更、backward compatibility に関わる不明点は `Blocking Questions` に残し、それ以外は `Assumptions` として進める。
- サブエージェントは既存 JSON schema を維持し、Context Packet 使用時は Output Contract 共通 fields を追加して、変更、検証、残課題を簡潔に返す。
