import { applyDecorators } from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiNotFoundResponse,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { GetEnterpriseDividendAnalysisResponseDto } from "../dto/enterprises/get-enterprise-dividend-analysis-response.dto";
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

export const GetEnterpriseDividendAnalysisDocs = () =>
  applyDecorators(
    ApiTags("Dividend Analysis"),
    ApiCookieAuth("accessTokenCookie"),
    ApiOperation({
      summary: "高配当分析詳細取得",
      description:
        "JWT 認証済みユーザー向けに、指定された4桁証券コードの保存済みまたは J-Quants API mock 由来の高配当分析詳細を返す。画面リクエスト中に J-Quants API へ同期アクセスしない。",
    }),
    ApiParam({
      name: "symbolId",
      description: "4桁証券コード。例: 8058, 9432。",
      example: "8058",
    }),
    ApiOkResponse({
      description: "高配当分析詳細",
      type: GetEnterpriseDividendAnalysisResponseDto,
    }),
    ApiBadRequestResponse({
      description: "symbolId が4桁証券コード形式ではない",
      type: ErrorResponseSchema,
    }),
    ApiUnauthorizedResponse({
      description: "JWT Cookie がない、または無効",
      type: ErrorResponseSchema,
    }),
    ApiNotFoundResponse({
      description: "BFF が返却対象としていない symbolId",
      type: ErrorResponseSchema,
    }),
    ApiInternalServerErrorResponse({
      description: "保存済み分析データ取得または mock resource 取得に失敗",
      type: ErrorResponseSchema,
    }),
  );
