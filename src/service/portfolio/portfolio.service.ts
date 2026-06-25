import { Injectable } from "@nestjs/common";

import { GetPortfolioAnalysisResponseDto } from "../../dto/portfolio/get-portfolio-analysis-response.dto";
import { GetPortfolioHoldingsResponseDto } from "../../dto/portfolio/get-portfolio-holdings-response.dto";

@Injectable()
export class PortfolioService {
  async getHoldings(): Promise<GetPortfolioHoldingsResponseDto> {
    return new GetPortfolioHoldingsResponseDto({
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
  }

  getAnalysis(args: { holdingIds: string[] }): GetPortfolioAnalysisResponseDto {
    void args;

    return new GetPortfolioAnalysisResponseDto({
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
  }
}
