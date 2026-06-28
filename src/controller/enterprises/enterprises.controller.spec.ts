import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";

import { JwtAuthGuard } from "../../guard/jwt-auth.guard";
import { EnterprisesService } from "../../service/enterprises/enterprises.service";
import { EnterprisesController } from "./enterprises.controller";

type EnterprisesServiceMock = Pick<
  EnterprisesService,
  "getQuantsInfo" | "getDividendAnalysis"
>;

describe("EnterprisesController", () => {
  let controller: EnterprisesController;
  let enterprisesService: jest.Mocked<EnterprisesServiceMock>;

  beforeEach(async () => {
    enterprisesService = {
      getQuantsInfo: jest.fn().mockReturnValue({
        enterprises: [
          {
            symbolId: "9432",
            companyName: "NTT",
            sector: "情報・通信業",
            rank: 1,
            totalScore: 92,
            judgement: "安全寄り",
            safetyLabel: "safe",
            scoreBreakdown: {
              fcf: { score: 30, maxScore: 30, isNotApplicable: false },
              dividendCutHistory: {
                score: 20,
                maxScore: 20,
                periodYears: 10,
              },
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
      }),
      getDividendAnalysis: jest.fn().mockReturnValue({
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
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EnterprisesController],
      providers: [
        {
          provide: EnterprisesService,
          useValue: enterprisesService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<EnterprisesController>(EnterprisesController);
  });

  it("calls the corresponding service and returns fixed enterprise quants info", () => {
    const response = controller.getQuantsInfo();

    expect(enterprisesService.getQuantsInfo).toHaveBeenCalledTimes(1);
    expect(response.enterprises).toHaveLength(1);
    expect(response.enterprises[0]).toEqual({
      symbolId: "9432",
      companyName: "NTT",
      sector: "情報・通信業",
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
    });
    expect(response).toMatchObject({
      updatedAt: "2026-06-26T00:00:00.000Z",
      dataAsOfDate: "2026-06-26",
      isRealtime: false,
      disclaimers: [
        "本画面は配当持続性を分析するためのものであり、特定銘柄の売買を推奨するものではありません。",
      ],
    });
  });

  it("calls the corresponding service and returns fixed dividend analysis detail", () => {
    const response = controller.getDividendAnalysis("8058");

    expect(enterprisesService.getDividendAnalysis).toHaveBeenCalledWith("8058");
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

  it("rejects non-4-digit symbolId before calling the service", () => {
    expect(() => controller.getDividendAnalysis("abc")).toThrow(
      BadRequestException,
    );
    expect(enterprisesService.getDividendAnalysis).not.toHaveBeenCalled();
  });
});
