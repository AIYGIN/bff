import { Test } from "@nestjs/testing";

import { GetPortfolioAnalysisQueryDto } from "../../dto/portfolio/get-portfolio-analysis-query.dto";
import { GetPortfolioAnalysisResponseDto } from "../../dto/portfolio/get-portfolio-analysis-response.dto";
import { JwtAuthGuard } from "../../guard/jwt-auth.guard";
import { PortfolioService } from "../../service/portfolio/portfolio.service";
import { PortfolioController } from "./portfolio.controller";

describe("PortfolioController getAnalysis", () => {
  const holdingIds = [
    "550e8400-e29b-41d4-a716-446655440001",
    "550e8400-e29b-41d4-a716-446655440002",
  ];

  const response = new GetPortfolioAnalysisResponseDto({
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
  });

  let controller: PortfolioController;
  let portfolioService: jest.Mocked<Pick<PortfolioService, "getAnalysis">>;

  beforeEach(async () => {
    portfolioService = {
      getAnalysis: jest.fn().mockReturnValue(response),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [PortfolioController],
      providers: [{ provide: PortfolioService, useValue: portfolioService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = moduleRef.get(PortfolioController);
  });

  it("returns portfolio analysis from PortfolioService", async () => {
    await expect(
      controller.getAnalysis(new GetPortfolioAnalysisQueryDto({ holdingIds })),
    ).resolves.toBe(response);
    expect(portfolioService.getAnalysis).toHaveBeenCalledWith({ holdingIds });
  });
});
