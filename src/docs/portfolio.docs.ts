import { applyDecorators } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { GetPortfolioAnalysisResponseDto } from "../dto/portfolio/get-portfolio-analysis-response.dto";
import { GetPortfolioHoldingsResponseDto } from "../dto/portfolio/get-portfolio-holdings-response.dto";
import { ErrorResponseSchema } from "./schemas/error-response.schema";

const portfolioHoldingsExample = {
  holdings: [
    {
      holdingId: "550e8400-e29b-41d4-a716-446655440001",
      productName: "eMAXIS Slim 全世界株式（オール・カントリー）",
      ratio: 60,
    },
    {
      holdingId: "550e8400-e29b-41d4-a716-446655440002",
      productName: "SBI・V・S&P500インデックス・ファンド",
      ratio: 40,
    },
  ],
  lastUpdated: "2026-06-22T00:00:00.000Z",
};

const portfolioAnalysisExample = {
  sectorAllocations: [
    { name: "Information Technology", ratio: 24.5 },
    { name: "Financials", ratio: 12.3 },
  ],
  constituents: [
    { name: "Apple Inc.", ratio: 4.8 },
    { name: "Microsoft Corp.", ratio: 4.2 },
  ],
  countryAllocations: [
    { name: "United States", ratio: 62.1 },
    { name: "Japan", ratio: 5.5 },
  ],
  lastUpdated: "2026-06-22T00:00:00.000Z",
};

export const GetPortfolioHoldingsDocs = () =>
  applyDecorators(
    ApiTags("Portfolio"),
    ApiCookieAuth("accessTokenCookie"),
    ApiOperation({
      summary: "ポートフォリオ保有商品を取得する",
      description:
        "ポートフォリオ画面 v1 の保有商品を取得する BFF API。v1 では BFF resource に配置した mock holdings を返します。認証は JwtAuthGuard 必須です。",
    }),
    ApiOkResponse({
      description: "ポートフォリオ保有商品の取得に成功しました",
      type: GetPortfolioHoldingsResponseDto,
      example: portfolioHoldingsExample,
    }),
    ApiUnauthorizedResponse({
      description: "未認証",
      type: ErrorResponseSchema,
    }),
    ApiNotFoundResponse({
      description: "holdings 未登録",
      type: ErrorResponseSchema,
    }),
    ApiInternalServerErrorResponse({
      description: "想定外エラー",
      type: ErrorResponseSchema,
    }),
  );

export const GetPortfolioAnalysisDocs = () =>
  applyDecorators(
    ApiTags("Portfolio"),
    ApiCookieAuth("accessTokenCookie"),
    ApiOperation({
      summary:
        "holdings と限定商品マスタからポートフォリオ分析を取得する",
      description:
        "ポートフォリオ画面 v1 の分析結果を返す BFF API。FE は GET /portfolio/holdings で取得した holdingId をカンマ区切り query として渡します。BFF は holdings のすべての情報と限定商品マスタを用いて、セクター、銘柄、国別配分を算出します。各配列は ratio が高い順で返します。v1 は BFF resource mock holdings と BFF 内限定商品マスタで運用し、外部 API / スクレイピング接続は Controller mock PR の対象外です。product master / Entity / internal model は OpenAPI に公開せず、公開 DTO のみ schema 化します。認証は JwtAuthGuard 必須です。",
    }),
    ApiQuery({
      name: "holdingIds",
      required: true,
      description:
        "分析対象 holdingId UUID のカンマ区切り文字列",
      example:
        "550e8400-e29b-41d4-a716-446655440001,550e8400-e29b-41d4-a716-446655440002",
      schema: {
        type: "string",
        pattern:
          "^[0-9a-fA-F-]{36}(,[0-9a-fA-F-]{36})*$",
      },
    }),
    ApiOkResponse({
      description: "ポートフォリオ分析結果の取得に成功しました",
      type: GetPortfolioAnalysisResponseDto,
      example: portfolioAnalysisExample,
    }),
    ApiBadRequestResponse({
      description: "リクエストが不正です",
      type: ErrorResponseSchema,
    }),
    ApiUnauthorizedResponse({
      description: "未認証",
      type: ErrorResponseSchema,
    }),
    ApiNotFoundResponse({
      description: "指定された保有商品が見つかりません",
      type: ErrorResponseSchema,
    }),
    ApiInternalServerErrorResponse({
      description: "想定外エラー",
      type: ErrorResponseSchema,
    }),
  );
