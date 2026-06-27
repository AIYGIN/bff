import { applyDecorators } from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { GetEnterpriseQuantsInfoResponseDto } from "../dto/enterprises/get-enterprise-quants-info-response.dto";
import { ErrorResponseSchema } from "./schemas/error-response.schema";

export const GetEnterpriseQuantsInfoDocs = () =>
  applyDecorators(
    ApiTags("enterprises"),
    ApiCookieAuth("accessTokenCookie"),
    ApiOperation({
      summary: "企業クオンツ情報取得",
      description: "企業別のクオンツ情報ランキングを取得する。",
    }),
    ApiOkResponse({
      description: "企業別クオンツ情報ランキング",
      type: GetEnterpriseQuantsInfoResponseDto,
    }),
    ApiBadRequestResponse({
      description: "不正なリクエスト",
      type: ErrorResponseSchema,
    }),
    ApiUnauthorizedResponse({
      description: "認証エラー",
      type: ErrorResponseSchema,
    }),
    ApiInternalServerErrorResponse({
      description: "サーバーエラー",
      type: ErrorResponseSchema,
    }),
  );
