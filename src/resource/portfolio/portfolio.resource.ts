export type PortfolioHoldingRecord = {
  holdingId: string;
  productName: string;
  ratio: number;
};

export class PortfolioResource {
  getHoldings(): PortfolioHoldingRecord[] {
    return [
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
    ];
  }
}
