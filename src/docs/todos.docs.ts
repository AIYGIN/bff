import { applyDecorators } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { ErrorResponseSchema } from "./schemas/error-response.schema";
import { CreateTodoRequestDto } from "../interface/dto/todo/create-todo-request.dto";
import { TodoDto } from "../interface/dto/todo/todo.dto";

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
