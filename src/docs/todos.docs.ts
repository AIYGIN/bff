import { applyDecorators } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiCookieAuth,
  ApiInternalServerErrorResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { ErrorResponseSchema } from "./schemas/error-response.schema";
import { CreateTodoRequestDto } from "../dto/todo/create-todo-request.dto";
import { TodoDto } from "../dto/todo/todo.dto";
import { UpdateTodoRequestDto } from "../dto/todo/update-todo-request.dto";

export const GetTodosDocs = () =>
  applyDecorators(
    ApiTags("todos"),
    ApiCookieAuth("accessTokenCookie"),
    ApiOperation({
      summary: "TODO一覧取得",
      description:
        "ログイン済みユーザーのTODO一覧を作成日時の新しい順で取得する。",
    }),
    ApiOkResponse({
      description: "TODO一覧",
      type: TodoDto,
      isArray: true,
    }),
    ApiInternalServerErrorResponse({
      description: "サーバーエラー",
      type: ErrorResponseSchema,
    }),
    ApiUnauthorizedResponse({
      description: "認証エラー",
      type: ErrorResponseSchema,
    }),
  );

export const GetTodoDocs = () =>
  applyDecorators(
    ApiTags("todos"),
    ApiCookieAuth("accessTokenCookie"),
    ApiOperation({
      summary: "TODO取得",
      description: "ログイン済みユーザーが所有する指定TODOを取得する。",
    }),
    ApiParam({
      name: "id",
      description: "TODO ID",
      required: true,
      schema: { type: "string", format: "uuid" },
      example: "11111111-1111-1111-1111-111111111111",
    }),
    ApiOkResponse({
      description: "TODO情報",
      type: TodoDto,
    }),
    ApiBadRequestResponse({
      description: "不正なリクエスト",
      type: ErrorResponseSchema,
    }),
    ApiNotFoundResponse({
      description: "TODOが見つかりません",
      type: ErrorResponseSchema,
    }),
    ApiInternalServerErrorResponse({
      description: "サーバーエラー",
      type: ErrorResponseSchema,
    }),
    ApiUnauthorizedResponse({
      description: "認証エラー",
      type: ErrorResponseSchema,
    }),
  );

export const CreateTodoDocs = () =>
  applyDecorators(
    ApiTags("todos"),
    ApiCookieAuth("accessTokenCookie"),
    ApiOperation({
      summary: "TODO作成",
      description:
        "ログイン済みユーザーのTODOとして、指定されたタイトルで新しいTODOを作成する。作成直後の completed は false として返す。",
    }),
    ApiBody({
      type: CreateTodoRequestDto,
    }),
    ApiCreatedResponse({
      description: "作成されたTODO",
      type: TodoDto,
    }),
    ApiBadRequestResponse({
      description: "リクエストボディのバリデーションエラー",
      type: ErrorResponseSchema,
    }),
    ApiInternalServerErrorResponse({
      description: "サーバーエラー",
      type: ErrorResponseSchema,
    }),
    ApiUnauthorizedResponse({
      description: "認証エラー",
      type: ErrorResponseSchema,
    }),
  );

export const DeleteTodoDocs = () =>
  applyDecorators(
    ApiTags("todos"),
    ApiCookieAuth("accessTokenCookie"),
    ApiOperation({
      summary: "TODO削除",
      description:
        "ログイン済みユーザーが所有する指定TODOを削除する。成功時はレスポンス body を返さない。",
    }),
    ApiParam({
      name: "id",
      description: "削除対象 TODO ID",
      required: true,
      schema: { type: "string", format: "uuid" },
      example: "11111111-1111-1111-1111-111111111111",
    }),
    ApiNoContentResponse({
      description: "TODO削除成功",
    }),
    ApiNotFoundResponse({
      description: "TODOが見つかりません",
      type: ErrorResponseSchema,
    }),
    ApiInternalServerErrorResponse({
      description: "サーバーエラー",
      type: ErrorResponseSchema,
    }),
    ApiUnauthorizedResponse({
      description: "認証エラー",
      type: ErrorResponseSchema,
    }),
  );

export const UpdateTodoDocs = () =>
  applyDecorators(
    ApiTags("todos"),
    ApiCookieAuth("accessTokenCookie"),
    ApiOperation({
      summary: "TODO完了状態更新",
      description:
        "ログイン済みユーザーが所有する指定TODOの完了状態を更新し、更新後のTODOを返す。",
    }),
    ApiParam({
      name: "id",
      description: "TODO ID",
      schema: { type: "string", format: "uuid" },
      required: true,
    }),
    ApiBody({
      type: UpdateTodoRequestDto,
      required: true,
    }),
    ApiOkResponse({
      description: "更新されたTODO",
      type: TodoDto,
    }),
    ApiBadRequestResponse({
      description: "リクエストボディのバリデーションエラー",
      type: ErrorResponseSchema,
    }),
    ApiNotFoundResponse({
      description: "TODOが見つからない",
      type: ErrorResponseSchema,
    }),
    ApiInternalServerErrorResponse({
      description: "サーバーエラー",
      type: ErrorResponseSchema,
    }),
    ApiUnauthorizedResponse({
      description: "認証エラー",
      type: ErrorResponseSchema,
    }),
  );
