# 変換ルール定義（BFF plan-to-issue）

## 1. 基本方針

- 1 Issue = 1目的（または1成果物）
- 情報は構造化するが、実装者が作業順を復元できることを最優先する
- summaryは要約してよいが、tasksは要約せず実行手順へ展開する
- BFFでは、API契約、レイヤー責務、OpenAPI、TDD、security / compatibility をIssueの中心にする

---

## 2. Issue種別

| 種別 | 用途 | 正本workflow |
| --- | --- | --- |
| api-mock | Controller mock と Swagger/OpenAPI 契約を作る | `.codex/workflows/api_controller_mock_flow.md` |
| api-implementation | 合意済みmock/API契約を本実装へ置き換える | `.codex/workflows/api_implementation_flow.md` |
| foundation | 設定、DI、logging、error handling、HTTP client、認証共通部、CIなど | `.codex/workflows/foundation_implementation_flow.md` |
| docs / test / chore | 補助作業 | 関連docsとAGENTS.md |

---

## 3. フィールド対応ルール

### 3-1 summary（概要）

- 目的ベースで1〜3文
- 実装詳細は書かない
- 要約OK

### 3-2 background（背景）

- 現状、課題、必要性を記述する
- 根拠がIssue、PR、仕様、既存コードにある場合はリンクまたはパスを明記する

### 3-3 scope（スコープ）

- In Scope / Out of Scopeを必ず分ける
- API契約変更、認証/認可、外部API接続、DB、Provider連携、migrationが対象外なら明記する

### 3-4 api_contract_or_public_interface

作業種別に応じて書き分ける。

#### api-mock

- endpoint method / path
- request params / query / body
- response DTO
- error response
- tag / summary / description
- mock response
- EntityをOpenAPIへ公開しないこと

#### api-implementation

- 対象API IF Issue
- 対象Controller mock PR
- 実装対象endpoint
- 既存OpenAPI契約の変更有無
- 外部API request / response / error mapping
- DTO / Entity変換方針

#### foundation

- public interface
- configuration / defaults
- module/provider/export方針
- failure behavior
- compatibility constraints

### 3-5 layer_design

BFFのレイヤー境界を明示する。

- Controller: requestの受け口。Service呼び出しだけを担当する
- Service: DTO / primitive valueを受け取り、DTOを返す。Swagger decoratorやHTTP clientを持たない
- Resource: 外部API接続を担当し、Entityを返す。DTO / Controller / Service / Swagger decoratorを持たない
- Entity: 外部API/永続化表現。OpenAPI `components.schemas` に公開しない
- DTO / docs decorator: 公開契約を表現する
- Module wiring: provider / controller / import / exportを明示する

該当しないレイヤーは `該当なし` と書く。

### 3-6 tasks

#### 絶対ルール

次の抽象語だけのタスクは禁止する。

- 実装する
- 対応する
- 作る
- 改善する
- テストする

#### 必須ルール

- 設計 → RED → GREEN → レビュー → PR/Issue更新の順で展開する
- 1タスク = 30〜90分程度の単一アクションにする
- 具体動詞（定義する、追加する、接続する、検証する、記録する）を使う
- Issue本文とコメントから確定した仕様だけを書く

#### API mockで含めるカテゴリ

- Issue本文・最新コメントの仕様確認
- DTO / docs decorator設計
- Controller / 対応Service / module wiring設計
- Controller testとOpenAPI e2e testのRED作成
- DTO / docs decorator / Controller / 対応Service / module wiringの最小実装
- error response / tag / summary / description のOpenAPI確認
- mock_reviewer相当のルール確認
- draft PR作成とIssueコメント記録

#### API implementationで含めるカテゴリ

- API IF Issue / Controller mock PR / 最新コメントの確認
- Service / Resource / Entity / DTO変換方針の定義
- 外部API request / response / error mappingの定義
- Service / Resource / Controller / e2eのRED作成
- Resource接続とmock固定レスポンス置換
- layer-boundaryとOpenAPI非回帰確認
- RED/GREEN実行ログ記録
- draft PR作成とIssueコメント記録

#### Foundationで含めるカテゴリ

- 要求、public interface、configuration、security、compatibility、failure behaviorの確認
- unit / integration / e2e testのRED作成
- module/provider/filter/guard/interceptor等の最小実装
- secret / token / password / cookie / 個人情報のredaction確認
- 既存API response bodyとOpenAPI documentの非回帰確認
- RED/GREEN実行ログ記録
- draft PR作成とIssueコメント記録

### 3-7 acceptance_criteria

- 「できること」で記述する
- 必ずテスト可能にする
- API契約またはpublic interfaceの合否を判定できる条件を含める
- レイヤー境界の合否を判定できる条件を含める
- security / privacy / compatibility制約がある場合は条件化する
- `pnpm lint` / `pnpm typecheck` / `pnpm test --runInBand` / `pnpm build` などは「実行結果」だけでなく、どの振る舞い・非回帰を確認するかも書く

例:

- OpenAPI documentの対象pathに `GET /todos` が含まれ、response schemaがDTOを参照していること
- ControllerがResource / Entity / HTTP clientをimportしていないこと
- EntityがOpenAPI `components.schemas` に含まれていないこと
- 認証情報、cookie、token、passwordがログに出力されないこと

### 3-8 test_plan

- REDで追加するtest
- GREENで通すtest
- 必要なコマンド
- OpenAPI e2e / endpoint e2e / unit / integration の区別
- 非回帰確認

### 3-9 security_and_compatibility

- 認証/認可、header、timeout、retry、CORS、cookie、JWT、secret、個人情報、ログredaction、既存API非回帰を必要に応じて書く
- 該当しない場合は `該当なし` と書く

### 3-10 notes

- Assumptions
- Blocking Questions
- Follow-up Issue候補
- Out of Scope補足

---

## 4. タイトル生成ルール

### フォーマット

```text
<type>: <内容の要約>
```

### type分類

- `feat`: API追加、機能追加、ユーザー価値のあるBFF挙動
- `fix`: 不具合修正
- `refactor`: 挙動を変えない内部改善
- `docs`: ドキュメント追加・更新
- `test`: テスト追加・修正
- `infra`: 設定、CI、logging、observability、環境構築
- `chore`: 上記に当てはまらない雑務

### ルール

- 30〜60文字程度
- Issue種別が分かる語を入れる（例: Controller mock、本実装、ログ基盤）
- summaryをベースにする

---

## 5. Issue分割ルール

- 10タスク以上 → 分割を検討する
- `api-mock` と `api-implementation` は原則として別Issue
- 複数endpoint、複数外部Provider、横断基盤とAPI追加の混在は分割する
- API契約変更が本実装中に必要になった場合は、理由と差分をIssueコメントに残す

---

## 6. 不足情報補完

- 既存docs、workflow、コードから安全に確定できる内容は補完可
- 推測は `補足・未確定事項` に明記する
- security、公開契約、データ損失、破壊的migrationに関わる不明点は質問して停止する

---

## 7. 禁止事項

- tasksの要約
- 実行不能な抽象タスク
- Issue本文・コメントにない仕様追加
- EntityをOpenAPI公開schemaへ露出する計画
- Frontend都合だけのresponse変更
- Controller / Service / Resource の責務混在
- REDなしでGREEN実装だけを前提にしたIssue

---

## 8. 出力品質チェック

- tasksが実行手順へ完全展開されている
- Issue種別と正本workflowが対応している
- API契約またはpublic interfaceが明確
- layer_designとacceptance_criteriaが対応している
- test_planにRED/GREENと非回帰確認がある
- security / compatibilityが該当時に条件化されている
- Out of Scope / Blocking Questionsが明示されている
