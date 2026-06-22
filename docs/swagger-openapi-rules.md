# Swagger / OpenAPI Rules

## 目的

このドキュメントは NestJS BFF における Swagger / OpenAPI の書き方を定義する。

Swagger / OpenAPI は BFF API の公開契約を表す。

このプロジェクトでは `@nestjs/swagger` を使い、DTO class と Controller method の decorator から OpenAPI document を生成する。

## 基本方針

レイヤー境界は `docs/layer-boundaries.md` を正本とし、この文書では
Swagger/OpenAPI 固有ルールだけを定義する。

* Swagger / OpenAPI の operation 定義は `src/docs` に置く
* Controller には `src/docs` の decorator だけを付与する
* DTO property schema は DTO class に書く
* Entity は OpenAPI に公開しない
* Service / Resource は Swagger を知らない状態にする
* Swagger のためだけの example / schema / decorator は `src/docs` に集約する

## ディレクトリ構成

```txt
src/docs/
  {domain}.docs.ts

  decorators/
    api-common-error-responses.decorator.ts
    api-pagination.decorator.ts
    api-auth.decorator.ts

  schemas/
    error-response.schema.ts
    pagination.schema.ts

  examples/
    user.example.ts
    error.example.ts
```

## src/docs の責務

`src/docs` は Swagger / OpenAPI の annotation 定義を置く専用ディレクトリとする。

### 許可

* Controller に付与する Swagger decorator を定義する
* API tag を定義する
* operation summary / description を定義する
* request parameter の説明を定義する
* response status / response DTO / error response を定義する
* Swagger 用 example を定義する
* 共通 error schema を定義する
* Swagger 表示のためだけに必要な helper decorator を定義する

### 禁止

* Service を import しない
* Resource を import しない
* Entity を import しない
* 外部 API response 型を import しない
* 業務ロジックを書かない
* runtime の分岐処理を書かない
* Controller の処理を代替しない

## Controller ルール

Controller では `src/docs` の decorator を使う。

### OK

```ts
@Get(':userId')
@GetUserDocs()
async getUser(
  @Param('userId') userId: string,
): Promise<UserDto> {
  return this.userService.getUser({ userId });
}
```

### NG

```ts
@Get(':userId')
@ApiOperation({ summary: 'ユーザー取得' })
@ApiOkResponse({ type: UserDto })
@ApiBadRequestResponse({ description: '不正なリクエスト' })
@ApiInternalServerErrorResponse({ description: 'サーバーエラー' })
async getUser(...) {
  ...
}
```

Controller に `@ApiOperation()` / `@ApiOkResponse()` / `@ApiBadRequestResponse()` などを大量に直書きしない。

## Operation docs ルール

`src/docs/{domain}.docs.ts` に operation 単位の decorator を定義する。

複数の Swagger decorator は `applyDecorators` でまとめる。

```ts
import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { UserDto } from '@/dto/user.dto';

export const GetUserDocs = () =>
  applyDecorators(
    ApiTags('users'),
    ApiOperation({
      summary: 'ユーザー取得',
      description: '指定したユーザーIDに紐づくユーザー情報を取得する。',
    }),
    ApiParam({
      name: 'userId',
      description: 'ユーザーID',
      example: 'user_123',
    }),
    ApiOkResponse({
      description: 'ユーザー情報',
      type: UserDto,
    }),
    ApiBadRequestResponse({
      description: '不正なリクエスト',
    }),
    ApiInternalServerErrorResponse({
      description: 'サーバーエラー',
    }),
  );
```

## docs に書くもの

operation 単位の定義は docs に書く。

```txt
@ApiTags
@ApiOperation
@ApiParam
@ApiQuery
@ApiBody
@ApiOkResponse
@ApiCreatedResponse
@ApiBadRequestResponse
@ApiUnauthorizedResponse
@ApiForbiddenResponse
@ApiNotFoundResponse
@ApiInternalServerErrorResponse
@ApiExtraModels
@ApiBearerAuth
```

## DTO に書くもの

DTO property 単位の schema は DTO class に書く。

```txt
@ApiProperty
@ApiPropertyOptional
@ApiHideProperty
```

## DTO schema ルール

DTO property には `@ApiProperty()` または `@ApiPropertyOptional()` を付与する。

```ts
export class UserDto {
  @ApiProperty({
    description: 'ユーザーID',
    example: 'user_123',
  })
  id: string;

  @ApiProperty({
    description: 'ユーザー名',
    example: '山田 太郎',
  })
  name: string;

  @ApiProperty({
    description: '保有ポイント',
    example: 1200,
  })
  point: number;
}
```

## Request DTO ルール

Controller の入力 DTO には validation decorator と Swagger property decorator を付与する。

```ts
export class GetUserRequestDto {
  @ApiProperty({
    description: 'ユーザーID',
    example: 'user_123',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;
}
```

Validation と Swagger は目的が異なるため、両方を必要に応じて付与する。

* validation decorator は runtime validation 用
* Swagger decorator は OpenAPI schema 表示用

## Entity ルール

Entity には Swagger decorator を付けない。

理由:

* Entity は Resource 用の内部型
* Frontend に公開する schema ではない
* 外部 API / PF の都合を BFF API 仕様に漏らさないため
* BFF の公開契約は DTO で表現するため

NG:

```ts
export class GetUserEntityResponse {
  @ApiProperty()
  id: string;
}
```

OK:

```ts
export class GetUserEntityResponse {
  id: string;
}
```

## Error response schema ルール

共通 error response は `src/docs/schemas` に置く。

```ts
export class ErrorResponseSchema {
  @ApiProperty({
    description: 'エラーコード',
    example: 'BAD_REQUEST',
  })
  code: string;

  @ApiProperty({
    description: 'エラーメッセージ',
    example: 'Invalid request',
  })
  message: string;

  @ApiProperty({
    description: 'リクエストID',
    example: 'req_123456789',
  })
  requestId: string;
}
```

共通 error response decorator は `src/docs/decorators` に置く。

```ts
import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseSchema } from '../schemas/error-response.schema';

export const ApiCommonErrorResponses = () =>
  applyDecorators(
    ApiBadRequestResponse({
      description: '不正なリクエスト',
      type: ErrorResponseSchema,
    }),
    ApiUnauthorizedResponse({
      description: '認証エラー',
      type: ErrorResponseSchema,
    }),
    ApiInternalServerErrorResponse({
      description: 'サーバーエラー',
      type: ErrorResponseSchema,
    }),
  );
```

operation docs では共通 decorator を使う。

```ts
export const GetUserDocs = () =>
  applyDecorators(
    ApiTags('users'),
    ApiOperation({
      summary: 'ユーザー取得',
    }),
    ApiOkResponse({
      description: 'ユーザー情報',
      type: UserDto,
    }),
    ApiCommonErrorResponses(),
  );
```

## Example ルール

再利用する example は `src/docs/examples` に置く。

```ts
export const userExample = {
  id: 'user_123',
  name: '山田 太郎',
  point: 1200,
} as const;
```

DTO では example の値を参照してよい。

```ts
export class UserDto {
  @ApiProperty({
    description: 'ユーザーID',
    example: userExample.id,
  })
  id: string;

  @ApiProperty({
    description: 'ユーザー名',
    example: userExample.name,
  })
  name: string;

  @ApiProperty({
    description: '保有ポイント',
    example: userExample.point,
  })
  point: number;
}
```

docs でも response example として参照してよい。

```ts
export const GetUserDocs = () =>
  applyDecorators(
    ApiOkResponse({
      description: 'ユーザー情報',
      type: UserDto,
      example: userExample,
    }),
  );
```

## Naming ルール

### docs file

```txt
{domain}.docs.ts
```

例:

```txt
users.docs.ts
items.docs.ts
orders.docs.ts
```

### operation decorator

```txt
{OperationName}Docs
```

例:

```ts
GetUserDocs
CreateUserDocs
UpdateUserDocs
DeleteUserDocs
```

### common decorator

```txt
api-{name}.decorator.ts
```

例:

```txt
api-common-error-responses.decorator.ts
api-pagination.decorator.ts
api-auth.decorator.ts
```

### schema

```txt
{name}.schema.ts
```

例:

```txt
error-response.schema.ts
pagination.schema.ts
```

### example

```txt
{name}.example.ts
```

例:

```txt
user.example.ts
error.example.ts
```

## Swagger setup ルール

`main.ts` では `SwaggerModule` と `DocumentBuilder` を使って OpenAPI document を生成する。

```ts
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('BFF API')
  .setDescription('Frontend 向け BFF API')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

const document = SwaggerModule.createDocument(app, config);

SwaggerModule.setup('docs', app, document);
```

Swagger UI の path は原則として以下にする。

```txt
/docs
```

OpenAPI JSON の出力 path が必要な場合は以下を使用する。

```txt
/docs-json
```

## Import ルール

### 許可

```txt
docs -> dto
docs -> docs/decorators
docs -> docs/schemas
docs -> docs/examples

controller -> docs
```

### 禁止

```txt
docs -> service
docs -> resource
docs -> entity
docs -> external api response type

service -> docs
service -> swagger decorator

resource -> docs
resource -> swagger decorator

entity -> swagger decorator
```

## OpenAPI 公開契約ルール

OpenAPI に公開する schema は DTO を基本とする。

```txt
DTO
  -> @ApiProperty
  -> docs decorator
  -> Controller method
  -> SwaggerModule
  -> OpenAPI document
```

Entity は OpenAPI に公開しない。

```txt
Entity
  -> Resource internal contract only
```

## Docs test ルール

必要に応じて e2e test で OpenAPI document を生成し、以下を確認する。

* endpoint が OpenAPI document に含まれること
* response schema が DTO を参照していること
* error response が定義されていること
* tag / summary / description が定義されていること
* Entity が schema として公開されていないこと

## Codex 実装ルール

Codex は Swagger / OpenAPI 対応時に以下の順序で進める。

1. DTO に `@ApiProperty()` / `@ApiPropertyOptional()` を付与する
2. 必要な example を `src/docs/examples` に作成する
3. 必要な共通 schema を `src/docs/schemas` に作成する
4. 必要な共通 decorator を `src/docs/decorators` に作成する
5. `src/docs/{domain}.docs.ts` に operation decorator を作成する
6. Controller method に docs decorator を付与する
7. OpenAPI document または e2e test で出力を確認する
8. lint / typecheck / test を実行する

## Codex 禁止事項

* Controller に Swagger decorator を大量に直書きしない
* Service / Resource に Swagger decorator を import しない
* Entity に Swagger decorator を付けない
* Entity を response schema に使わない
* docs から Service / Resource / Entity を import しない
* 外部 API response 型を OpenAPI schema として公開しない
* DTO と Entity を兼用しない
* example に secret / token / 個人情報の raw data を含めない

## Codex チェックリスト

```txt
[ ] Controller に Swagger decorator が大量に直書きされていないか
[ ] Controller が src/docs の decorator を使っているか
[ ] DTO property に @ApiProperty / @ApiPropertyOptional があるか
[ ] Entity に Swagger decorator が付いていないか
[ ] Entity が response schema として公開されていないか
[ ] docs が Service / Resource / Entity を import していないか
[ ] operation summary / description が定義されているか
[ ] response DTO が定義されているか
[ ] error response が定義されているか
[ ] example が必要な箇所に定義されているか
[ ] OpenAPI document 上で endpoint / schema / response が確認できるか
```

## 最重要原則

Swagger / OpenAPI の責務は以下に閉じる。

```txt
DTO
  -> property schema

src/docs
  -> operation docs
  -> response docs
  -> error docs
  -> examples
  -> shared schemas

Controller
  -> docs decorator を付与するだけ

Service / Resource / Entity
  -> Swagger を知らない
```

公開 API 仕様は DTO と docs で表現し、外部 API / PF の内部都合は Entity と Resource に閉じる。
