import { applyDecorators } from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

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
