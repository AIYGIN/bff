import { PortfolioService } from "./portfolio.service";

describe("PortfolioService", () => {
  it("returns fixed mock portfolio holdings", async () => {
    const service = new PortfolioService();

    await expect(service.getHoldings()).resolves.toEqual({
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
  });
});
