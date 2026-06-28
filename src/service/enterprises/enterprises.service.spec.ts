import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";

import { JQuantsEnterpriseQuantsInfoMockResource } from "../../resource/enterprises/j-quants-enterprise-quants-info-mock.resource";
import { EnterprisesService } from "./enterprises.service";

describe("EnterprisesService", () => {
  let service: EnterprisesService;
  let resource: jest.Mocked<JQuantsEnterpriseQuantsInfoMockResource>;

  beforeEach(async () => {
    resource = {
      findManyFromJQuantsApiMock: jest.fn().mockReturnValue([
        {
          symbolId: "8058",
          companyName: "三菱商事",
          sector: "商社",
          rank: 1,
          totalScore: 92,
          judgement: "安全寄り",
          safetyLabel: "safe",
          scoreBreakdown: {
            fcf: { score: 30, maxScore: 30, isNotApplicable: false },
            dividendCutHistory: { score: 20, maxScore: 20, periodYears: 10 },
            dividendGrowth: { score: 12, maxScore: 15, periodYears: 10 },
            payoutRatio: { score: 15, maxScore: 15 },
            dividendYield: { score: 8, maxScore: 10 },
            financialMetrics: { score: 7, maxScore: 10 },
          },
          latestDividendYield: 3.7,
          isFinancialBusiness: false,
          isFcfNotApplicable: false,
          updatedAt: "2026-06-26T00:00:00.000Z",
          dataAsOfDate: "2026-06-26",
        },
      ]),
      findOneDividendAnalysisFromJQuantsApiMock: jest
        .fn()
        .mockImplementation((symbolId: string) => {
          if (symbolId === "8058") {
            return {
              symbolId: "8058",
              companyName: "三菱商事",
              sector: "商社",
              totalScore: 92,
              judgement: "安全寄り",
              safetyLabel: "safe",
              metrics: {
                fcf: 123456789,
                payoutRatio: 41.3,
                dividendGrowthRate10y: 11.2,
                dividendCutCount10y: 0,
                per: 11.2,
                pbr: 1.2,
                roe: 13.3,
              },
              scoreBreakdown: {
                fcf: {
                  score: 30,
                  maxScore: 30,
                  isNotApplicable: false,
                  reason: "3年連続プラス",
                },
                dividendCutHistory: {
                  score: 20,
                  maxScore: 20,
                  periodYears: 10,
                  reason: "過去10年で減配なし",
                },
                dividendGrowth: {
                  score: 12,
                  maxScore: 15,
                  periodYears: 10,
                  reason: "年平均+11.2%",
                },
                payoutRatio: {
                  score: 15,
                  maxScore: 15,
                  reason: "健全な水準",
                },
                dividendYield: {
                  score: 8,
                  maxScore: 10,
                  reason: "目安レンジ内",
                },
                financialMetrics: {
                  score: 7,
                  maxScore: 10,
                  reason: "PER/PBR/ROEから補助判定",
                },
              },
              isFinancialBusiness: false,
              isFcfNotApplicable: false,
              updatedAt: "2026-06-26T00:00:00.000Z",
              dataAsOfDate: "2026-06-26",
            };
          }
          if (symbolId === "8306") {
            return {
              symbolId: "8306",
              companyName: "三菱UFJ FG",
              sector: "銀行業",
              totalScore: 84,
              judgement: "安全寄り",
              safetyLabel: "safe",
              metrics: {
                fcf: null,
                payoutRatio: 42.1,
                dividendGrowthRate10y: 9.2,
                dividendCutCount10y: 0,
                per: 10.8,
                pbr: 0.9,
                roe: 8.5,
              },
              scoreBreakdown: {
                fcf: {
                  score: null,
                  maxScore: 30,
                  isNotApplicable: true,
                  reason: "金融業はFCFの評価対象外のためN/A",
                },
                dividendCutHistory: {
                  score: 20,
                  maxScore: 20,
                  periodYears: 10,
                  reason: "過去10年で減配なし",
                },
                dividendGrowth: {
                  score: 9,
                  maxScore: 15,
                  periodYears: 10,
                  reason: "年平均+9.2%",
                },
                payoutRatio: {
                  score: 15,
                  maxScore: 15,
                  reason: "健全な水準",
                },
                dividendYield: {
                  score: 6,
                  maxScore: 10,
                  reason: "目安レンジ内",
                },
                financialMetrics: {
                  score: 5,
                  maxScore: 10,
                  reason: "PER/PBR/ROEから補助判定",
                },
              },
              isFinancialBusiness: true,
              isFcfNotApplicable: true,
              updatedAt: "2026-06-26T00:00:00.000Z",
              dataAsOfDate: "2026-06-26",
            };
          }
          return null;
        }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnterprisesService,
        {
          provide: JQuantsEnterpriseQuantsInfoMockResource,
          useValue: resource,
        },
      ],
    }).compile();

    service = module.get<EnterprisesService>(EnterprisesService);
  });

  it("maps J-Quants API mock resource entities to response DTO", () => {
    const response = service.getQuantsInfo();

    expect(resource.findManyFromJQuantsApiMock).toHaveBeenCalledTimes(1);
    expect(response).toEqual({
      enterprises: [
        {
          symbolId: "8058",
          companyName: "三菱商事",
          sector: "商社",
          rank: 1,
          totalScore: 92,
          judgement: "安全寄り",
          safetyLabel: "safe",
          scoreBreakdown: {
            fcf: { score: 30, maxScore: 30, isNotApplicable: false },
            dividendCutHistory: { score: 20, maxScore: 20, periodYears: 10 },
            dividendGrowth: { score: 12, maxScore: 15, periodYears: 10 },
            payoutRatio: { score: 15, maxScore: 15 },
            dividendYield: { score: 8, maxScore: 10 },
            financialMetrics: { score: 7, maxScore: 10 },
          },
          latestDividendYield: 3.7,
          isFinancialBusiness: false,
          isFcfNotApplicable: false,
          updatedAt: "2026-06-26T00:00:00.000Z",
          dataAsOfDate: "2026-06-26",
        },
      ],
      updatedAt: "2026-06-26T00:00:00.000Z",
      dataAsOfDate: "2026-06-26",
      isRealtime: false,
      disclaimers: [
        "本画面は配当持続性を分析するためのものであり、特定銘柄の売買を推奨するものではありません。",
      ],
    });
  });

  it("maps a J-Quants API mock detail entity to dividend analysis response DTO", () => {
    const response = service.getDividendAnalysis("8058");

    expect(
      resource.findOneDividendAnalysisFromJQuantsApiMock,
    ).toHaveBeenCalledWith("8058");
    expect(response).toEqual({
      symbolId: "8058",
      companyName: "三菱商事",
      sector: "商社",
      totalScore: 92,
      judgement: "安全寄り",
      safetyLabel: "safe",
      metrics: {
        fcf: 123456789,
        payoutRatio: 41.3,
        dividendGrowthRate10y: 11.2,
        dividendCutCount10y: 0,
        per: 11.2,
        pbr: 1.2,
        roe: 13.3,
      },
      scoreBreakdown: {
        fcf: {
          score: 30,
          maxScore: 30,
          isNotApplicable: false,
          reason: "3年連続プラス",
        },
        dividendCutHistory: {
          score: 20,
          maxScore: 20,
          periodYears: 10,
          reason: "過去10年で減配なし",
        },
        dividendGrowth: {
          score: 12,
          maxScore: 15,
          periodYears: 10,
          reason: "年平均+11.2%",
        },
        payoutRatio: {
          score: 15,
          maxScore: 15,
          reason: "健全な水準",
        },
        dividendYield: {
          score: 8,
          maxScore: 10,
          reason: "目安レンジ内",
        },
        financialMetrics: {
          score: 7,
          maxScore: 10,
          reason: "PER/PBR/ROEから補助判定",
        },
      },
      analysisSummary: null,
      isFinancialBusiness: false,
      isFcfNotApplicable: false,
      dataSources: [{ name: "J-Quants API mock", asOfDate: "2026-06-26" }],
      updatedAt: "2026-06-26T00:00:00.000Z",
      dataAsOfDate: "2026-06-26",
      scoreVersion: "dividend-score-v1",
      isRealtime: false,
      disclaimers: [
        "本画面は配当持続性を分析するためのものであり、特定銘柄の売買を推奨するものではありません。",
      ],
    });
  });

  it("returns nullable FCF values for financial businesses", () => {
    const response = service.getDividendAnalysis("8306");

    expect(response.metrics.fcf).toBeNull();
    expect(response.scoreBreakdown.fcf).toMatchObject({
      score: null,
      isNotApplicable: true,
      reason: "金融業はFCFの評価対象外のためN/A",
    });
    expect(response.isFinancialBusiness).toBe(true);
    expect(response.isFcfNotApplicable).toBe(true);
  });

  it("throws not found when the symbolId has no mock dividend analysis", () => {
    expect(() => service.getDividendAnalysis("9999")).toThrow(
      NotFoundException,
    );
  });
});
