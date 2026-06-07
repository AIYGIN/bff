# docs/bff-code-design-rules.md

# BFF Code Design Rules

## 目的

このドキュメントは NestJS BFF のコード設計ルールを定義する。

BFF は以下を責務とする。

* Frontend 向けの API ルーティングを提供する
* 外部 API / Platform / Provider API との差分を吸収する
* 単一または複数 Resource の結果を Service で組み合わせる
* Frontend に返す DTO を Service で確定する
* Controller を薄く保つ
* 外部 API 疎通の詳細を Resource に閉じる
* Resource 用の Entity と BFF 公開用の DTO を分離する

## ディレクトリ構成

```txt
src/
  controller/
    *.controller.ts

  services/
    *.service.ts

  resources/
    *.resource.ts

  interface/
    dto/
      *.dto.ts
    entity/
      *.entity.ts

  docs/
    *.docs.ts
    decorators/
    schemas/
    examples/
```

必要に応じて以下を追加してよい。

```txt
src/
  modules/
    *.module.ts

  common/
    decorators/
    filters/
    guards/
    interceptors/
    pipes/
    errors/
    utils/
```

## レイヤー責務

## Controller

Controller は routing と Service 呼び出しだけを担当する。

### 許可

* HTTP method / path の定義
* request parameter / query / body の受け取り
* DTO 型の受け取り
* Service の呼び出し
* Service から返された DTO の返却
* `src/docs` で定義した Swagger decorator の付与

### 禁止

* Resource を直接呼ばない
* Entity を import しない
* 外部 API を直接呼ばない
* 複数 Resource の合成処理を書かない
* 業務ロジックを書かない
* 外部 API response を加工しない
* try-catch を乱用して個別にエラー変換しない
* Swagger / OpenAPI の詳細定義を大量に直書きしない

### 例

```ts
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':userId')
  @GetUserDocs()
  async getUser(
    @Param('userId') userId: string,
  ): Promise<UserDto> {
    return this.userService.getUser({ userId });
  }
}
```

## Service

Service は BFF のユースケース層とする。

### 許可

* Controller から受け取った DTO / primitive value を処理する
* 単一 Resource を呼び出す
* 複数 Resource を呼び出して結果を合成する
* Entity から DTO へ変換する
* BFF として必要な業務ロジックを実装する
* Controller に返す DTO を確定する

### 禁止

* HTTP client を直接操作しない
* 外部 API endpoint / header / query / body を直接組み立てない
* Controller 固有 decorator に依存しない
* Swagger / OpenAPI decorator を import しない
* Resource の raw response を Controller に返さない
* any で型エラーを回避しない

### 例

```ts
@Injectable()
export class UserService {
  constructor(
    private readonly userResource: UserResource,
    private readonly pointResource: PointResource,
  ) {}

  async getUser(request: GetUserRequestDto): Promise<UserDto> {
    const user = await this.userResource.getUser({
      userId: request.userId,
    });

    const point = await this.pointResource.getPoint({
      userId: request.userId,
    });

    return new UserDto({
      id: user.id,
      name: user.name,
      point: point.amount,
    });
  }
}
```

## Resource

Resource は外部 API / Platform / Provider API との疎通層とする。

Resource は API や PF ごとにクラスを分ける。

### 許可

* 外部 API request の作成
* 外部 API への通信
* 外部 API response の受け取り
* 外部 API response から Entity への変換
* API ごとの header / auth / endpoint / query / body の組み立て
* API 固有 error の変換

### 禁止

* DTO を返さない
* DTO を import しない
* Service を import しない
* Controller を import しない
* Swagger / OpenAPI decorator を import しない
* Frontend 表示都合の整形をしない
* 複数 Resource の合成をしない
* raw API response をそのまま Service に返さない

### 例

```ts
@Injectable()
export class UserResource {
  constructor(private readonly httpClient: HttpClient) {}

  async getUser(request: GetUserEntityRequest): Promise<GetUserEntityResponse> {
    const response = await this.httpClient.get<ExternalUserResponse>(
      `/external/users/${request.userId}`,
    );

    return new GetUserEntityResponse({
      id: response.data.id,
      name: response.data.display_name,
      status: response.data.status,
    });
  }
}
```

## Interface

`src/interface` は BFF 内で使う型定義を置く。

```txt
src/interface/
  dto/
  entity/
```

## DTO

DTO は Controller / Service の request / response を表す。

### 用途

* BFF API の公開契約
* Controller input
* Controller output
* Service input
* Service output
* Swagger schema の元になる class

### 命名ルール

```txt
{UseCase}RequestDto
{UseCase}ResponseDto
{Domain}Dto
```

### 例

```ts
export class GetUserRequestDto {
  userId: string;
}

export class UserDto {
  id: string;
  name: string;
  point: number;

  constructor(args: UserDto) {
    Object.assign(this, args);
  }
}
```

## Entity

Entity は Resource の request / response を表す。

### 用途

* Resource に渡す request
* Resource が返す response
* 外部 API / PF のデータ構造を BFF 内部向けに正規化したもの

### 命名ルール

```txt
{Resource}{Action}EntityRequest
{Resource}{Action}EntityResponse
{Domain}Entity
```

### 例

```ts
export class GetUserEntityRequest {
  userId: string;

  constructor(args: GetUserEntityRequest) {
    Object.assign(this, args);
  }
}

export class GetUserEntityResponse {
  id: string;
  name: string;
  status: string;

  constructor(args: GetUserEntityResponse) {
    Object.assign(this, args);
  }
}
```

## DTO と Entity の境界

DTO と Entity は明確に分離する。

### DTO

DTO は BFF API の公開契約である。

Frontend に返す形、Controller が受け取る形、Service が扱う use case 単位の request / response は DTO とする。

### Entity

Entity は Resource の内部契約である。

外部 API / PF との疎通に必要な request / response の正規化型は Entity とする。

Entity は Controller response として返さない。

## Import ルール

### 許可

```txt
controller -> service
controller -> dto
controller -> docs

service -> resource
service -> dto
service -> entity

resource -> entity

docs -> dto
docs -> docs/decorators
docs -> docs/schemas
docs -> docs/examples
```

### 禁止

```txt
controller -> resource
controller -> entity

service -> docs
service -> swagger decorator

resource -> dto
resource -> service
resource -> docs
resource -> swagger decorator

docs -> service
docs -> resource
docs -> entity

dto -> entity
entity -> dto
```

## データ変換ルール

基本方針:

* 外部 API response から Entity への変換は Resource で行う
* Entity から DTO への変換は Service で行う
* Controller では変換しない
* docs は変換処理に関与しない

```txt
HTTP Request
  -> Controller
  -> RequestDto
  -> Service
  -> EntityRequest
  -> Resource
  -> External API
  -> EntityResponse
  -> Service
  -> ResponseDto
  -> Controller
  -> HTTP Response
```

## 複数 Resource を使う場合

複数 Resource の合成は必ず Service で行う。

```ts
const user = await this.userResource.getUser(...);
const point = await this.pointResource.getPoint(...);

return new UserDto({
  id: user.id,
  name: user.name,
  point: point.amount,
});
```

Resource 同士を直接呼び出してはいけない。

## Module ルール

NestJS module は依存関係の境界を明示するために使う。

基本方針:

* Controller / Service / Resource は module に登録する
* Service / Resource は provider として扱う
* docs は provider として登録しない
* docs は DI しない
* docs は純粋な decorator 定義として扱う

例:

```ts
@Module({
  controllers: [UserController],
  providers: [
    UserService,
    UserResource,
    PointResource,
  ],
})
export class UserModule {}
```

## Error Handling ルール

Resource は外部 API 固有のエラーをそのまま漏らさない。

Resource では以下を行う。

* HTTP status を確認する
* API 固有 error code を確認する
* BFF 内部で扱う例外に変換する
* secret / token / raw header をログに出さない

Service では以下を行う。

* 複数 Resource の整合性エラーを扱う
* Frontend に返すべきエラー種別に変換する
* Resource の詳細実装に依存しない

Controller では原則として個別 try-catch を書かない。

## Logging ルール

ログに含めてよいもの:

* request id
* user id
* resource name
* external API name
* status code
* elapsed time
* use case name

ログに含めてはいけないもの:

* access token
* refresh token
* password
* cookie
* 個人情報の raw data
* 外部 API の raw response 全体

## Test ルール

### Controller test

Controller test では以下を確認する。

* route が Service を呼ぶこと
* request DTO が Service に渡ること
* Service の返り値がそのまま返ること

Controller test では Resource を mock しない。Service を mock する。

### Service test

Service test では以下を確認する。

* 単一 Resource の response を DTO に変換できること
* 複数 Resource の response を合成できること
* Resource error を適切に扱えること

Service test では Resource を mock する。

### Resource test

Resource test では以下を確認する。

* 正しい endpoint / method / header / body / query で外部 API を呼ぶこと
* 外部 API response を Entity に変換できること
* 外部 API error を BFF 内部 error に変換できること

Resource test では HTTP client を mock する。

## Codex 実装ルール

Codex は実装時に以下の順序で進める。

### 新規 API 追加時の実装順

1. DTO を作成する
2. Entity を作成する
3. Resource を作成する
4. Service を作成する
5. Swagger docs decorator を作成する
6. Controller を作成する
7. Module に登録する
8. Test を作成する
9. lint / typecheck / test を実行する

### 修正時の確認順

1. Controller が薄いか確認する
2. Controller が `src/docs` の decorator を使っているか確認する
3. Service に変換 / 合成ロジックがあるか確認する
4. Resource が外部 API 疎通だけに閉じているか確認する
5. DTO と Entity が混ざっていないか確認する
6. Entity が Controller response として返されていないか確認する
7. 禁止 import がないか確認する
8. Test が責務ごとに分かれているか確認する

### Codex が守るべき禁止事項

* Controller に業務ロジックを追加しない
* Controller から Resource を直接呼ばない
* Resource から DTO を返さない
* Entity を Controller の response として返さない
* DTO と Entity を同じ class で兼用しない
* Service / Resource に Swagger decorator を import しない
* any で型エラーを回避しない
* 外部 API の raw response をそのまま返さない
* secret をログ出力しない
* 既存の責務分離を崩すリファクタを勝手にしない

## Codex チェックリスト

```txt
[ ] Controller は routing と Service 呼び出しだけか
[ ] Controller が Resource / Entity を import していないか
[ ] Controller が docs decorator を使っているか
[ ] Service が DTO を返しているか
[ ] Service で Entity -> DTO 変換をしているか
[ ] Service が Swagger decorator を import していないか
[ ] Resource が Entity を返しているか
[ ] Resource が DTO を import していないか
[ ] DTO と Entity が分離されているか
[ ] 複数 Resource の合成が Service にあるか
[ ] 外部 API の詳細が Resource に閉じているか
[ ] validation が必要な input DTO に付いているか
[ ] test が Controller / Service / Resource の責務ごとに分かれているか
[ ] lint / typecheck / test が通るか
```

## 最重要原則

この BFF では、依存方向を必ず以下に保つ。

```txt
Controller
  -> Service
    -> Resource
      -> External API
```

Swagger / OpenAPI の依存方向は以下に保つ。

```txt
Controller
  -> docs
    -> DTO
```

データ型の変換責務は以下に保つ。

```txt
External API Response
  -> Resource
  -> Entity
  -> Service
  -> DTO
  -> Controller Response
```

Controller は薄く、Service はユースケース、Resource は外部 API 疎通、interface は DTO / Entity の契約定義、docs は Swagger / OpenAPI annotation 定義に集中させる。
