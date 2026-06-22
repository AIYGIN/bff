import { applyDecorators } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { UserDto } from "../dto/user/user.dto";

export const GetUserDocs = () =>
  applyDecorators(
    ApiTags("users"),
    ApiOperation({
      summary: "ユーザー取得",
      description: "指定したユーザーIDに紐づくユーザー情報を取得する。",
    }),
    ApiParam({
      name: "userId",
      description: "ユーザーID",
      example: "user_123",
    }),
    ApiOkResponse({
      description: "ユーザー情報",
      type: UserDto,
    }),
    ApiBadRequestResponse({
      description: "不正なリクエスト",
    }),
    ApiInternalServerErrorResponse({
      description: "サーバーエラー",
    }),
  );
