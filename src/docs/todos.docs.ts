import { applyDecorators } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { ErrorResponseSchema } from "./schemas/error-response.schema";
import { CreateTodoRequestDto } from "../interface/dto/todo/create-todo-request.dto";
import { TodoDto } from "../interface/dto/todo/todo.dto";
import { UpdateTodoRequestDto } from "../interface/dto/todo/update-todo-request.dto";

export const GetTodosDocs = () =>
  applyDecorators(
    ApiTags("todos"),
    ApiOperation({
      summary: "TODO一覧取得",
      description: "TODO一覧を作成日時の新しい順で取得する。",
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
  );

export const CreateTodoDocs = () =>
  applyDecorators(
    ApiTags("todos"),
    ApiOperation({
      summary: "TODO作成",
      description:
        "指定されたタイトルで新しいTODOを作成する。作成直後の completed は false として返す。",
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
  );

export const UpdateTodoDocs = () =>
  applyDecorators(
    ApiTags("todos"),
    ApiOperation({
      summary: "TODO完了状態更新",
      description: "指定したTODOの完了状態を更新し、更新後のTODOを返す。",
    }),
    ApiParam({
      name: "id",
      description: "TODO ID",
      type: String,
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
  );
