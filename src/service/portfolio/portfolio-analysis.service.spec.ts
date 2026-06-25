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
  "sectorAllocations": [
    { "name": "情報技術", "ratio": 30.25 },
    { "name": "金融", "ratio": 14.10 },
    { "name": "資本財・サービス", "ratio": 10.79 },
    { "name": "一般消費財・サービス", "ratio": 8.95 },
    { "name": "ヘルスケア", "ratio": 8.87 },
    { "name": "コミュニケーション・サービス", "ratio": 8.12 },
    { "name": "生活必需品", "ratio": 5.86 },
    { "name": "エネルギー", "ratio": 4.63 },
    { "name": "素材", "ratio": 3.26 },
    { "name": "公益事業", "ratio": 2.17 },
    { "name": "不動産", "ratio": 1.09 },
    { "name": "その他・未分類", "ratio": 1.91 }
  ],
  "constituents": [
    { "name": "NVIDIA Corp.", "ratio": 4.60 },
    { "name": "Apple Inc.", "ratio": 4.15 },
    { "name": "Alphabet Inc.", "ratio": 3.51 },
    { "name": "Microsoft Corp.", "ratio": 3.13 },
    { "name": "Amazon.com Inc.", "ratio": 2.39 },
    { "name": "Broadcom Inc.", "ratio": 1.85 },
    { "name": "Meta Platforms Inc.", "ratio": 1.25 },
    { "name": "Taiwan Semiconductor Manufacturing Co. Ltd.", "ratio": 1.16 },
    { "name": "Tesla Inc.", "ratio": 1.13 },
    { "name": "Qualcomm Inc.", "ratio": 0.64 },
    { "name": "Texas Instruments Inc.", "ratio": 0.56 },
    { "name": "UnitedHealth Group Inc.", "ratio": 0.48 },
    { "name": "Samsung Electronics Co. Ltd.", "ratio": 0.39 },
    { "name": "Coca-Cola Co.", "ratio": 0.38 },
    { "name": "Merck & Co. Inc.", "ratio": 0.37 },
    { "name": "Chevron Corp.", "ratio": 0.36 },
    { "name": "Verizon Communications Inc.", "ratio": 0.35 },
    { "name": "Procter & Gamble Co.", "ratio": 0.34 },
    { "name": "ConocoPhillips", "ratio": 0.33 },
    { "name": "Amgen Inc.", "ratio": 0.33 },
    { "name": "Micron Technology Inc.", "ratio": 0.27 },
    { "name": "Eli Lilly and Co.", "ratio": 0.21 },
    { "name": "Other / Unspecified", "ratio": 71.82 }
  ],
  "countryAllocations": [
    { "name": "米国", "ratio": 70.76 },
    { "name": "日本", "ratio": 4.26 },
    { "name": "英国", "ratio": 2.37 },
    { "name": "台湾", "ratio": 2.31 },
    { "name": "カナダ", "ratio": 2.25 },
    { "name": "韓国", "ratio": 2.16 },
    { "name": "スイス", "ratio": 1.55 },
    { "name": "フランス", "ratio": 1.45 },
    { "name": "ドイツ", "ratio": 1.41 },
    { "name": "中国", "ratio": 0.85 },
    { "name": "オーストラリア", "ratio": 0.49 },
    { "name": "その他・未分類", "ratio": 10.14 }
  ],
  "lastUpdated": "2026-05-29T00:00:00.000Z"
}),
    );
  });
});
