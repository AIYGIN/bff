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
    });
  }

  getAnalysis(args: { holdingIds: string[] }): GetPortfolioAnalysisResponseDto {
    void args;

    return new GetPortfolioAnalysisResponseDto({
      sectorAllocations: [
        { name: "Information Technology", ratio: 30.25 },
        { name: "Financials", ratio: 14.1 },
        { name: "Industrials", ratio: 10.79 },
        { name: "Consumer Discretionary", ratio: 8.95 },
        { name: "Health Care", ratio: 8.87 },
        { name: "Communication Services", ratio: 8.12 },
        { name: "Consumer Staples", ratio: 5.86 },
        { name: "Energy", ratio: 4.63 },
        { name: "Materials", ratio: 3.26 },
        { name: "Utilities", ratio: 2.17 },
        { name: "Real Estate", ratio: 1.09 },
        { name: "Other / Unspecified", ratio: 1.91 },
      ],
      constituents: [
        { name: "NVIDIA Corp.", ratio: 4.6 },
        { name: "Apple Inc.", ratio: 4.15 },
        { name: "Microsoft Corp.", ratio: 3.13 },
        { name: "Alphabet Inc.", ratio: 3.51 },
        { name: "Amazon.com Inc.", ratio: 2.39 },
        { name: "Broadcom Inc.", ratio: 1.85 },
        { name: "Taiwan Semiconductor Manufacturing Co. Ltd.", ratio: 1.16 },
        { name: "Tesla Inc.", ratio: 1.13 },
        { name: "Meta Platforms Inc.", ratio: 1.25 },
        { name: "Qualcomm Inc.", ratio: 0.64 },
      ],
      countryAllocations: [
        { name: "United States", ratio: 70.76 },
        { name: "Japan", ratio: 4.26 },
        { name: "United Kingdom", ratio: 2.37 },
        { name: "Taiwan", ratio: 2.31 },
        { name: "Canada", ratio: 2.25 },
        { name: "South Korea", ratio: 2.16 },
        { name: "Switzerland", ratio: 1.55 },
        { name: "France", ratio: 1.45 },
        { name: "Germany", ratio: 1.41 },
        { name: "China", ratio: 0.85 },
        { name: "Australia", ratio: 0.49 },
        { name: "Other / Unspecified", ratio: 10.14 },
      ],
      lastUpdated: "2026-06-22T00:00:00.000Z",
    });
  }
}
