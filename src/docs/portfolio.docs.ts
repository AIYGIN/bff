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
      ratio: 37.9,
    },
    {
      holdingId: "550e8400-e29b-41d4-a716-446655440002",
      productName: "SBI・V・S&P500インデックス・ファンド",
      ratio: 15.8,
    },
    {
      holdingId: "550e8400-e29b-41d4-a716-446655440003",
      productName: "ＳＢＩ・全世界株式インデックス・ファンド",
      ratio: 36.8,
    },
    {
      holdingId: "550e8400-e29b-41d4-a716-446655440003",
      productName: "ＳＢＩ・Ｓ・米国高配当株式ファンド（年１回決算型）",
      ratio: 9.5,
    },
  ],
  lastUpdated: "2026-06-22T00:00:00.000Z",
};

const portfolioAnalysisExample = {
  sectorAllocations: [
    { name: "情報技術", ratio: 30.25 },
    { name: "金融", ratio: 14.1 },
    { name: "資本財・サービス", ratio: 10.79 },
    { name: "一般消費財・サービス", ratio: 8.95 },
    { name: "ヘルスケア", ratio: 8.87 },
    { name: "コミュニケーション・サービス", ratio: 8.12 },
    { name: "生活必需品", ratio: 5.86 },
    { name: "エネルギー", ratio: 4.63 },
    { name: "素材", ratio: 3.26 },
    { name: "公益事業", ratio: 2.17 },
    { name: "不動産", ratio: 1.09 },
    { name: "その他・未分類", ratio: 1.91 },
  ],
  constituents: [
    { name: "NVIDIA Corp.", ratio: 4.6 },
    { name: "Apple Inc.", ratio: 4.15 },
    { name: "Alphabet Inc.", ratio: 3.51 },
    { name: "Microsoft Corp.", ratio: 3.13 },
    { name: "Amazon.com Inc.", ratio: 2.39 },
    { name: "Broadcom Inc.", ratio: 1.85 },
    { name: "Meta Platforms Inc.", ratio: 1.25 },
    { name: "Taiwan Semiconductor Manufacturing Co. Ltd.", ratio: 1.16 },
    { name: "Tesla Inc.", ratio: 1.13 },
    { name: "Qualcomm Inc.", ratio: 0.64 },
    { name: "Texas Instruments Inc.", ratio: 0.56 },
    { name: "UnitedHealth Group Inc.", ratio: 0.48 },
    { name: "Samsung Electronics Co. Ltd.", ratio: 0.39 },
    { name: "Coca-Cola Co.", ratio: 0.38 },
    { name: "Merck & Co. Inc.", ratio: 0.37 },
    { name: "Chevron Corp.", ratio: 0.36 },
    { name: "Verizon Communications Inc.", ratio: 0.35 },
    { name: "Procter & Gamble Co.", ratio: 0.34 },
    { name: "ConocoPhillips", ratio: 0.33 },
    { name: "Amgen Inc.", ratio: 0.33 },
    { name: "Micron Technology Inc.", ratio: 0.27 },
    { name: "Eli Lilly and Co.", ratio: 0.21 },
    { name: "Other / Unspecified", ratio: 71.82 },
  ],
  countryAllocations: [
    { name: "米国", ratio: 70.76 },
    { name: "日本", ratio: 4.26 },
    { name: "英国", ratio: 2.37 },
    { name: "台湾", ratio: 2.31 },
    { name: "カナダ", ratio: 2.25 },
    { name: "韓国", ratio: 2.16 },
    { name: "スイス", ratio: 1.55 },
    { name: "フランス", ratio: 1.45 },
    { name: "ドイツ", ratio: 1.41 },
    { name: "中国", ratio: 0.85 },
    { name: "オーストラリア", ratio: 0.49 },
    { name: "その他・未分類", ratio: 10.14 },
  ],
  lastUpdated: "2026-05-29T00:00:00.000Z",
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
      summary: "holdings と限定商品マスタからポートフォリオ分析を取得する",
      description:
        "ポートフォリオ画面 v1 の分析結果を返す BFF API。FE は GET /portfolio/holdings で取得した holdingId をカンマ区切り query として渡します。BFF は holdings のすべての情報と限定商品マスタを用いて、セクター、銘柄、国別配分を算出します。各配列は ratio が高い順で返します。v1 は BFF resource mock holdings と BFF 内限定商品マスタで運用し、外部 API / スクレイピング接続は Controller mock PR の対象外です。product master / Entity / internal model は OpenAPI に公開せず、公開 DTO のみ schema 化します。認証は JwtAuthGuard 必須です。",
    }),
    ApiQuery({
      name: "holdingIds",
      required: true,
      description: "分析対象 holdingId UUID のカンマ区切り文字列",
      example:
        "550e8400-e29b-41d4-a716-446655440001,550e8400-e29b-41d4-a716-446655440002",
      schema: {
        type: "string",
        pattern: "^[0-9a-fA-F-]{36}(,[0-9a-fA-F-]{36})*$",
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
