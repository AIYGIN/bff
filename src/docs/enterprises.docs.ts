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
    ApiTags("Dividend Analysis"),
    ApiCookieAuth("accessTokenCookie"),
    ApiOperation({
      summary: "高配当分析向け企業クオンツ情報一覧取得",
      description:
        "JWT 認証済みユーザー向けに、保存済みまたは J-Quants API mock 由来の企業クオンツ情報一覧をスコア順で返す。画面リクエスト中に J-Quants API へ同期アクセスしない。未登録銘柄は一覧に含めない。",
    }),
    ApiOkResponse({
      description: "企業クオンツ情報一覧",
      type: GetEnterpriseQuantsInfoResponseDto,
    }),
    ApiBadRequestResponse({
      description: "リクエスト不正",
      type: ErrorResponseSchema,
    }),
    ApiUnauthorizedResponse({
      description: "JWT Cookie がない、または無効",
      type: ErrorResponseSchema,
    }),
    ApiInternalServerErrorResponse({
      description: "保存済み分析データ取得または mock resource 取得に失敗",
      type: ErrorResponseSchema,
    }),
  );
