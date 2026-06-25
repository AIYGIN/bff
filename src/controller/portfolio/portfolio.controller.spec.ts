import { Test } from "@nestjs/testing";

import { GetPortfolioHoldingsResponseDto } from "../../dto/portfolio/get-portfolio-holdings-response.dto";
import { AuthService } from "../../service/auth/auth.service";
import { PortfolioService } from "../../service/portfolio/portfolio.service";
import { PortfolioController } from "./portfolio.controller";

describe("PortfolioController", () => {
  it("returns portfolio holdings from PortfolioService", async () => {
    const response = new GetPortfolioHoldingsResponseDto({
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
    });
    const portfolioService = {
      getHoldings: jest.fn(async () => response),
    };
    const moduleRef = await Test.createTestingModule({
      controllers: [PortfolioController],
      providers: [
        {
          provide: PortfolioService,
          useValue: portfolioService,
        },
        {
          provide: AuthService,
          useValue: {
            verifyAccessToken: jest.fn(),
          },
        },
      ],
    }).compile();

    const controller = moduleRef.get(PortfolioController);

    await expect(controller.getHoldings()).resolves.toEqual(response);
    expect(portfolioService.getHoldings).toHaveBeenCalledTimes(1);
  });
});
