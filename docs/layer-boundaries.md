# Layer Boundaries

## 目的

NestJS BFF の Controller / Service / Resource / Guard / Utility / DTO /
Entity の責務と依存方向を定義する。この文書をレイヤー境界ルールの正本とする。

実装、レビュー、テスト、Codex agent、workflow は、個別文書へルールを複製せず
この文書を参照する。

## 依存方向

```txt
Controller -> Service -> Resource -> External API
```

逆方向の依存やレイヤーを飛び越える依存を作らない。

## ディレクトリ

```txt
src/
  guard/
  controller/
  service/
  resource/
  interface/
  dto/
  entity/
  docs/
  utility/
  common/
```

- `service` と `resource` は単数形にする。
- DTO は `src/dto/`、Entity は `src/entity/` に分離する。
- `src/interface/` は DTO / Entity 以外の内部契約に使う。
- `src/provider/` と `src/module/` は作らない。
- `*.module.ts` は責務を持つレイヤーの近くに置く。
- feature module は原則 Controller の近くに置く。
- 設定、logging、HTTP client などの共通 module は `src/common/` に置く。
- module を集めるためだけのディレクトリや重複 module を作らない。

## Controller

Controller と Service は 1対1 にする。

例:

- `AuthController -> AuthService`
- `UserController -> UserService`
- `TodoController -> TodoService`

Controller は対応する Service だけを inject する。

責務:

- HTTP routing
- NestJS annotation
- `src/docs` の docs decorator
- request DTO、path、query、header の受け取り
- 対応する Service の呼び出し
- response DTO の返却
- redirect、Cookie、status code など HTTP response の確定

禁止:

- 複数 Service や helper service を inject しない。
- Resource、Entity、HttpService を import または直接利用しない。
- 外部 API request / response を扱わない。
- Entity -> DTO 変換や複数 Resource の合成をしない。
- 業務ロジックや外部 API 固有 error mapping を書かない。

## Service

Service は BFF のユースケースを担当する。

責務:

- Controller から DTO / primitive value を受け取る。
- 単一または複数 Resource を呼び出す。
- BFF としてのエラーハンドリングを行う。
- Resource が返した Entity -> DTO 変換を担当する。
- 複数 Resource の Entity を合成する。
- Controller に返す DTO または HTTP 操作用のユースケース結果を確定する。
- DI が必要な設定値を受け取り、utility 関数へ明示引数として渡す。

禁止:

- HttpService、`@nestjs/axios`、Swagger decorator を import しない。
- 外部 API endpoint / header / body の詳細を組み立てない。
- Entity を Controller へ返さない。
- `any` で型エラーを回避しない。

## Resource

Resource は外部 API との疎通境界とする。

責務:

- 外部 API request の作成と送信
- 外部 API response の検証と内部表現への変換
- 外部 API 固有 error mapping
- Entity を返す

禁止:

- DTO を返さない、import しない。
- Controller、Service、Swagger decorator を import しない。
- Frontend 向けの表示変換をしない。
- 複数 Resource の結果を合成しない。
- raw response をそのまま Service に返さない。

## DTO

DTO は Controller / Service の公開入出力に使う。

- request DTO は validation と Swagger property schema を持ってよい。
- response DTO は BFF の公開 response body を表す。
- 外部 API 固有 field を DTO に漏らさない。
- DTO を Resource の戻り値にしない。

## Entity

Entity は Resource の request / response に使う内部型とする。

- Resource は Entity を返す。
- Service は Entity -> DTO 変換を行う。
- Entity を Swagger/OpenAPI に公開しない。
- Entity に `@nestjs/swagger` や `ApiProperty` を付けない。

## Guard

Guard は認証・認可処理だけを担当する。

- request から認証情報を取得する。
- 認証済み principal を `currentUser` として request に設定する。
- 認証失敗は内部理由を漏らさない generic 401 にする。
- Resource、Entity、HttpService、Swagger decorator を import しない。
- 外部 API を呼び出さない。

`jwt-auth.guard.ts`、`current-user.decorator.ts`、`current-user.ts` は
`src/guard/` に置く。

## Utility

Utility は Service や Guard を補助する DI 不要の純粋関数とする。

- cookie、jwt-token、oauth-state、opaque-subject、validation などを置く。
- `@Injectable()`、constructor injection、provider 登録を使わない。
- Utility に NestJS DI 依存を入れない。
- 設定、clock、codec など必要な値は引数として受け取る。
- helper service をむやみに増やさない。

## Auth

- AuthController に対応する Service は AuthService のみとする。
- AuthController は AuthService だけを inject する。
- Auth helper service は原則作らない。
- jwt-token / oauth-state / opaque-subject / cookie helper は
  `src/utility/auth/` に置く。
- 設定値は AuthService が AppConfigService から受け取り、utility へ渡す。
- GoogleOAuthResource は `src/resource/auth/` に置き、Entity を返す。
- JwtAuthGuard と current user 関連型は `src/guard/` に置く。

## Test

- Controller test は対応する Service だけを mock する。
- Service test は Resource 呼び出し、Entity -> DTO 変換、エラー処理を確認する。
- Resource test は外部 request / response 変換と error mapping を確認する。
- Utility test は DI container なしで純粋な入出力を確認する。
- Guard test は currentUser 設定と generic 401 を確認する。

Boundary test では最低限、以下を検証する。

- Controller が Resource / Entity / HttpService を import していない。
- Controller が対応する Service だけを inject している。
- Service が HttpService / Swagger decorator を import していない。
- Resource が DTO / Controller / Service / Swagger decorator を import していない。
- Entity が Swagger decorator を持たず OpenAPI schema に出ていない。
- Utility が NestJS DI に依存していない。
- Guard が Resource / Entity / HttpService / Swagger decorator を import していない。
- agent / workflow / ルールドキュメントがこの正本を参照している。

## 非回帰

- API response body を理由なく変更しない。
- Swagger/OpenAPI 契約を理由なく変更しない。
- テストを弱めて通さない。
- secret / token / cookie / authorization / password をログや fixture に残さない。
- 実装と agent ドキュメントを同時に更新する。
