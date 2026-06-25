import { GetPortfolioAnalysisResponseDto } from "../../dto/portfolio/get-portfolio-analysis-response.dto";
import { PortfolioService } from "./portfolio.service";

describe("PortfolioService getAnalysis", () => {
  it("returns the fixed portfolio analysis mock DTO", () => {
    const service = new PortfolioService();

    expect(
      service.getAnalysis({
        holdingIds: [
          "550e8400-e29b-41d4-a716-446655440001",
          "550e8400-e29b-41d4-a716-446655440002",
        ],
      }),
    ).toEqual(
      new GetPortfolioAnalysisResponseDto({
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
      }),
    );
  });
});
