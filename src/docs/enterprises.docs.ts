import { applyDecorators } from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiNotFoundResponse,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { GetEnterpriseAiSummaryResponseDto } from "../dto/enterprises/get-enterprise-ai-summary-response.dto";
import { GetEnterpriseDividendAnalysisResponseDto } from "../dto/enterprises/get-enterprise-dividend-analysis-response.dto";
import { ENTERPRISE_QUANTS_INFO_SORT_FIELDS } from "../dto/enterprises/get-enterprise-quants-info-query.dto";
import { GetEnterpriseQuantsInfoResponseDto } from "../dto/enterprises/get-enterprise-quants-info-response.dto";
import { ErrorResponseSchema } from "./schemas/error-response.schema";

export const GetEnterpriseQuantsInfoDocs = () =>
  applyDecorators(
    ApiTags("enterprises"),
    ApiCookieAuth("accessTokenCookie"),
    ApiOperation({
      summary: "高配当候補上位一覧を取得する",
      description:
        "J-Quants / EDINET への同期アクセスは画面 API リクエスト中に行わない。手動 batch で生成した統一データを import し、normalized model / Dividend Score Calculator の結果を返す。内部運用データは公開契約に含めない。",
    }),
    ApiQuery({
      name: "limit",
      required: false,
      description: "高配当候補上位 N 件。default 50。",
      example: 50,
    }),
    ApiQuery({
      name: "sort",
      required: false,
      enum: ENTERPRISE_QUANTS_INFO_SORT_FIELDS,
      description: "並び替え項目。default dividendScore。",
      example: "dividendScore",
    }),
    ApiQuery({
      name: "order",
      required: false,
      enum: ["asc", "desc"],
      description: "並び順。default desc。",
      example: "desc",
    }),
    ApiQuery({
      name: "scoreVersion",
      required: false,
      description: "スコアリングバージョン。未指定時は最新。",
      example: "v1",
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
      description: "normalized model 生成または CSV import の想定外エラー",
      type: ErrorResponseSchema,
    }),
  );

export const GetEnterpriseDividendAnalysisDocs = () =>
  applyDecorators(
    ApiTags("enterprises"),
    ApiCookieAuth("accessTokenCookie"),
    ApiOperation({
      summary: "指定銘柄の高配当分析を取得する",
      description:
        "J-Quants / EDINET への同期アクセスは画面 API リクエスト中に行わない。手動 batch で生成した統一データを import し、normalized model / Dividend Score Calculator の結果を返す。内部運用データは公開契約に含めない。",
    }),
    ApiParam({
      name: "symbolId",
      description: "4桁証券コード。例: 8058, 9432。",
      example: "8058",
    }),
    ApiQuery({
      name: "scoreVersion",
      required: false,
      description: "スコアリングバージョン。未指定時は最新。",
      example: "v1",
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
      description: "normalized model 生成または CSV import の想定外エラー",
      type: ErrorResponseSchema,
    }),
  );

export const GetEnterpriseAiSummaryDocs = () =>
  applyDecorators(
    ApiTags("enterprises"),
    ApiCookieAuth("accessTokenCookie"),
    ApiOperation({
      summary: "指定銘柄のAI要約を取得する",
      description:
        "高配当分析画面で表示するX投稿・コメント由来のAI要約を返す。画面 API リクエストでは外部データ取得先の指定を受け取らず、内部運用データは公開契約に含めない。",
    }),
    ApiParam({
      name: "symbolId",
      description: "4桁証券コード。例: 8306, 9432。",
      example: "8306",
    }),
    ApiOkResponse({
      description: "AI要約",
      type: GetEnterpriseAiSummaryResponseDto,
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
      description: "BFF が返却対象としていない symbolId または AI要約",
      type: ErrorResponseSchema,
    }),
    ApiInternalServerErrorResponse({
      description: "AI要約取得時の想定外エラー",
      type: ErrorResponseSchema,
    }),
  );
