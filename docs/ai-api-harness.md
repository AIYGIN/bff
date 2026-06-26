# AI API Harness

このドキュメントは、NestJS BFF で AI エージェントが API と共通基盤を
Issue 駆動で実装するためのハーネス設計を定義する。

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
- `docs/layer-boundaries.md`
- `docs/swagger-openapi-rules.md`
- `.codex/workflows/api_controller_mock_flow.md`
- `.codex/workflows/api_implementation_flow.md`
- `.codex/workflows/foundation_implementation_flow.md`
- `docs/configuration-logging-foundation.md`（設定・ログ基盤を変更する場合）

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
- `foundation_issue_responder`: 基盤 Issue とコメントを読み、TDD 実装 PR 作成までを進行する。
- `foundation_tester`: 基盤要求を unit / integration / e2e test として具体化する。
- `foundation_implementer`: failing test を通す共通基盤実装を行う。
- `foundation_reviewer`: 非回帰、security、DI、運用性、TDD ルールを確認する。

## Issue 種別の振り分け

- API endpoint / DTO / Swagger 契約の追加: Mock Issue 駆動フロー
- 合意済み API 契約の Service / Resource 本実装: 本実装 Issue 駆動フロー
- 設定、logging、error handling、HTTP client、認証共通部、observability、
  build、test、CI: 基盤 Issue 駆動フロー

複数種別にまたがる場合は、公開 API 契約の変更を API Issue として分離する。
API response body や Swagger 契約を変更しない横断的な変更は基盤 Issue とする。

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

## 基盤 Issue 駆動フロー

1. 人間が基盤 Issue に目的、変更範囲、public interface、test plan を書く。
2. 人間が Issue コメントで仕様を補足・修正する。
3. `foundation_issue_responder` が Issue、コメント、関連コードを読み、
   実装可能性とリスクを確認する。
4. 不明点が security、公開契約、データ損失に関わる場合は質問コメント案を
   出して停止する。
5. 十分な要求がある場合は `foundation_tester`、
   `foundation_implementer`、`foundation_reviewer` の順で TDD 実装する。

基盤 Issue の完了条件は、設定・DI・横断動作・機密情報保護・既存 API 非回帰が
test で表現されていることとする。Swagger/OpenAPI の変更は必須ではなく、
むしろ Issue にない契約変更がないことを確認する。

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
- Controller と 1対1 の対応 Service
- Controller module
- Controller test
- Service test
- OpenAPI e2e test

実装しないもの:

- 対応 Service 以外の Service の新規作成・改修
- 外部 API 接続
- Resource の本実装
- DB 接続
- 認証・認可の詳細
- Provider 固有の error mapping

## レイヤー責務

Controller / Service / Resource / Guard / Utility / DTO / Entity / Module の
責務と禁止事項は `docs/layer-boundaries.md` を正本とする。

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

基盤実装 PR は、最低限以下を満たすこと。

- 設定の default、型変換、不正値、本番必須値が unit test で確認されている。
- module/provider の DI と横断処理が必要な integration test で確認されている。
- HTTP 横断動作と既存 API 非回帰が e2e test で確認されている。
- request body、query、authorization、cookie、token、password、個人情報が
  ログへ出ない。
- 既存 API response body と Swagger/OpenAPI 契約を意図せず変更していない。
- `pnpm lint` が通る。
- `pnpm typecheck` が通る。
- `pnpm test --runInBand` が通る。
- `pnpm test:e2e --runInBand` が通る。
- `pnpm build` が通る。

### テスト結果の確認ルール

- テスト失敗時は、要約表示だけで判断しない。期待値と実測値が見えない場合は、同じ対象を raw 出力で再確認する。
- 具体的には、`--verbose`、`--json`、`--outputFile`、または一時ファイルへのリダイレクトを使って、失敗箇所の `expected` / `received` を確認する。
- 同じ失敗について 2 回程度確認しても原因が限定できない場合は、無理に深追いしない。分かった事実、試した確認方法、追加で必要な情報をユーザーへ報告する。
- 失敗が 1 テストや 1 期待値に閉じているなら、その箇所を局所修正する。複数テストへ波及しているなら、共通前提の変更を疑って先に切り分ける。

## PR 作成時の注意

- PR は draft で作る。
- PR 本文に Issue の API IF を転記する。
- 実行した command と結果を記載する。
- mock であること、後続で Resource 実装が必要なことを明記する。
- 本実装 PR では、実装計画 Issue、RED/GREEN の記録、外部 API / Resource / Service の設計判断を記載する。

## Context Packet

親エージェントがサブエージェントへ作業を渡す場合は、起動前に Context
Packet を作成する。Context Packet はサブエージェントの標準入力であり、Issue
本文、最新コメント、関連 diff、関連 docs から確認できた事実だけを渡すために使う。
サブエージェントに仕様の再解釈を任せない。

サブエージェントは Context Packet を主入力として扱い、`Must Read Files` を優先して読む。
open-ended な repo 全体探索は禁止する。ただし、layer-boundary、OpenAPI schema
exposure、security redaction、module wiring、既存 API 非回帰の確認に必要な場合は、
目的・検索範囲・使用コマンドを Output Contract の共通 fields に明記したうえで、
限定的な repo-wide search を許可する。

`Optional Files` は判断に必要な場合だけ読む。Context Packet にない仕様を勝手に追加せず、
不足情報があれば既存 JSON schema に Output Contract の共通 fields を追加し、
`status` を `blocked` または `partial` にして返す。

security/privacy、auth/authorization、API contract/response compatibility、data loss、
destructive migration、external provider contract、financial calculation semantics、
logging of sensitive data、Cookie/JWT/CORS、public API response の変更、backward
compatibility に関わる不明点は `Blocking Questions` に入れる。それ以外の不明点は
`Assumptions` に明記して進める。親エージェントはサブエージェントの要約を一次情報の
完全な代替にせず、採用前に必要な一次情報と照合する。

`Confirmed Requirements` には、親エージェントが Issue / PR / diff / docs から確定した
要件を書く。`Source References` には、その要件を確認した一次情報の出典を書く。
`facts` には、サブエージェントが作業中に追加で確認した事実を書く。
サブエージェントは `facts` に Context Packet の内容を丸写ししない。

```md
# Context Packet

## Task
- 対象作業:
- Issue / PR:
- 目的:

## Confirmed Requirements
- 確定した要件を書く。可能な限り各項目に source を付ける。
  - source: Issue #12 body

## Out of Scope
-

## Source References
- Issue:
- Latest comments:
- PR / diff:
- Docs:

## Must Read Files
- 原則最大8個まで
- 8個を超える場合は、なぜ必要かを Known Risks または Assumptions に明記する

## Optional Files
- 最大5個まで

## Relevant Rules
- 対象作業に必要なルールだけを書く
- 詳細 docs への参照を書く
- ルール全文の貼り付けは避ける

## Acceptance Criteria
-

## Known Risks
-

## Blocking Questions
- none または質問一覧

## Assumptions
-

## Output Contract
Output Contract は各 agent の既存 JSON schema を置き換えない。
各 agent は既存 JSON schema を維持したうえで、Context Packet 使用時は
以下の共通 fields を追加して返す。

{
  "status": "pass|blocked|partial|fail",
  "facts": [],
  "assumptions": [],
  "files_read": [],
  "risks": [],
  "commands": [],
  "test_results": "pass|fail|not_run with reason",
  "next_action": "..."
}

reviewer 系 agent は必要に応じて `files_reviewed` も追加する。
既存 schema にすでに `commands` / `test_results` がある agent では、既存 field を
Output Contract common field として扱い、重複定義しない。`files_changed` など
既存 schema にある fields は維持する。

`commands` には、サブエージェントが実行した検証コマンド、または結果として参照した
検証コマンドを書く。実行していない場合は空配列にし、理由を `test_results` に書く。

```json
{
  "commands": ["pnpm test --runInBand"],
  "test_results": "pass"
}
```

```json
{
  "commands": [],
  "test_results": "not_run because this is a docs-only review"
}
```

`test_results` には、検証結果を書く。実行した場合は pass/fail summary を書く。
実行していない場合は `not_run because ...` の形式で理由を書く。
```

### Token Policy

- `Must Read Files` は原則最大8個、`Optional Files` は最大5個にする。
- `Must Read Files` が8個を超える場合は、なぜ必要かを Context Packet の
  `Known Risks` または `Assumptions` に明記する。
- サブエージェントの出力は既存 JSON schema と Output Contract 共通 fields に沿って簡潔にする。
- 長い command output をそのまま貼らない。
- まず要約出力を確認し、失敗時だけ raw、verbose、json output を確認する。
- `git diff` は最初に stat または name-only を確認し、必要な path だけ詳細を見る。
- reviewer は原則 changed-files review に寄せる。
- 全体保証は layer-boundary test、OpenAPI e2e、unit test に寄せる。
- token 節約を理由に security、API 契約、data loss、migration に関わる確認を省略しない。
