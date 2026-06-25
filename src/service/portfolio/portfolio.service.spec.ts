import { PortfolioService } from "./portfolio.service";

describe("PortfolioService", () => {
  it("returns fixed mock portfolio holdings", async () => {
    const service = new PortfolioService();

    await expect(service.getHoldings()).resolves.toEqual({
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
  });
});
