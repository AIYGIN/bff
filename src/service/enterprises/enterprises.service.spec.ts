import { NotFoundException } from "@nestjs/common";

import { EnterprisesService } from "./enterprises.service";

type UnifiedDividendAnalysisResourceMock = {
  findMany: jest.Mock;
  findOne: jest.Mock;
  findManyFromJQuantsApiMock: jest.Mock;
  findOneDividendAnalysisFromJQuantsApiMock: jest.Mock;
};

const normalizedEntities = [
  {
    scoreVersion: "dividend-score-v1",
    symbolId: "8306",
    companyName: "三菱UFJ FG",
    rank: 1,
    dividendScore: 91,
    dividendYield: 3.3,
    jquantsAsOf: "2026-06-26",
    freeCashFlowStatus: "NOT_APPLICABLE",
    metrics: {
      dividendYield: 3.3,
      freeCashFlow: null,
      freeCashFlowStatus: "NOT_APPLICABLE",
    },
    analysis: {
      freeCashFlowStatus: "NOT_APPLICABLE",
      reason: "金融業はFCFの評価対象外のためN/A",
    },
    missingFields: ["freeCashFlow"],
    warnings: ["金融業はFCFの評価対象外のためN/A"],
  },
  {
    scoreVersion: "dividend-score-v1",
    symbolId: "8058",
    companyName: "三菱商事",
    rank: 2,
    dividendScore: 88,
    dividendYield: 3.5,
    jquantsAsOf: "2026-06-26",
    freeCashFlowStatus: "NOT_APPLICABLE",
    metrics: {
      dividendYield: 3.5,
      freeCashFlow: null,
      freeCashFlowStatus: "NOT_APPLICABLE",
    },
    analysis: {
      freeCashFlowStatus: "NOT_APPLICABLE",
      reason: "金融業はFCFの評価対象外のためN/A",
    },
    missingFields: ["freeCashFlow"],
    warnings: ["金融業はFCFの評価対象外のためN/A"],
  },
];

const legacyEnterprise = {
  symbolId: "8306",
  companyName: "三菱UFJ FG",
  sector: "銀行業",
  rank: 1,
  totalScore: 84,
  judgement: "安全寄り",
  safetyLabel: "safe",
  scoreBreakdown: {
    fcf: { score: 0, maxScore: 30, isNotApplicable: true },
    dividendCutHistory: { score: 20, maxScore: 20, periodYears: 10 },
    dividendGrowth: { score: 9, maxScore: 15, periodYears: 10 },
    payoutRatio: { score: 15, maxScore: 15 },
    dividendYield: { score: 6, maxScore: 10 },
    financialMetrics: { score: 5, maxScore: 10 },
  },
  latestDividendYield: 3.3,
  isFinancialBusiness: true,
  isFcfNotApplicable: true,
  updatedAt: "2026-06-26T00:00:00.000Z",
  dataAsOfDate: "2026-06-26",
};

const callGetQuantsInfo = (
  service: EnterprisesService,
  query: unknown,
): unknown =>
  (service.getQuantsInfo as unknown as (query: unknown) => unknown)(query);

const callGetDividendAnalysis = (
  service: EnterprisesService,
  symbolId: string,
  query: unknown,
): unknown =>
  (
    service.getDividendAnalysis as unknown as (
      symbolId: string,
      query: unknown,
    ) => unknown
  )(symbolId, query);

const callGetAiSummary = (
  service: EnterprisesService,
  symbolId: string,
): unknown =>
  (service.getAiSummary as unknown as (symbolId: string) => unknown)(symbolId);

describe("EnterprisesService", () => {
  let service: EnterprisesService;
  let resource: UnifiedDividendAnalysisResourceMock;

  beforeEach(() => {
    resource = {
      findMany: jest.fn().mockReturnValue(normalizedEntities),
      findOne: jest.fn().mockImplementation((symbolId: string) => {
        return (
          normalizedEntities.find((entity) => entity.symbolId === symbolId) ??
          null
        );
      }),
      findManyFromJQuantsApiMock: jest.fn().mockReturnValue([legacyEnterprise]),
      findOneDividendAnalysisFromJQuantsApiMock: jest
        .fn()
        .mockImplementation((symbolId: string) => {
          return symbolId === "8306" ? legacyEnterprise : null;
        }),
    };
    service = new EnterprisesService(resource as never);
  });

  it("calls the unified CSV resource and maps normalized entities to the quantsInfo DTO", () => {
    const query = {
      limit: 1,
      sort: "dividendScore",
      order: "desc",
      scoreVersion: "dividend-score-v1",
    };

    const response = callGetQuantsInfo(service, query);

    expect(resource.findMany).toHaveBeenCalledWith({
      scoreVersion: "dividend-score-v1",
    });
    expect(response).toEqual({
      scoreVersion: "dividend-score-v1",
      asOf: "2026-06-26",
      sort: "dividendScore",
      order: "desc",
      items: [
        {
          rank: 1,
          symbolId: "8306",
          companyName: "三菱UFJ FG",
          dividendScore: 91,
          dividendYield: 3.3,
          freeCashFlowStatus: "NOT_APPLICABLE",
          missingFields: ["freeCashFlow"],
          warnings: ["金融業はFCFの評価対象外のためN/A"],
        },
      ],
    });
  });

  it("applies default quantsInfo query values in the response DTO", () => {
    const response = callGetQuantsInfo(service, {}) as {
      sort: string;
      order: string;
      items: unknown[];
    };

    expect(resource.findMany).toHaveBeenCalledWith({
      scoreVersion: undefined,
    });
    expect(response.sort).toBe("dividendScore");
    expect(response.order).toBe("desc");
    expect(response.items).toHaveLength(2);
  });

  it("keeps rank 1-based and unique after limit/sort/order are applied by the resource", () => {
    const response = callGetQuantsInfo(service, {
      limit: 2,
      sort: "dividendScore",
      order: "desc",
      scoreVersion: "dividend-score-v1",
    }) as { items: { rank: number }[] };

    expect(response.items.map((item) => item.rank)).toEqual([1, 2]);
    expect(new Set(response.items.map((item) => item.rank)).size).toBe(2);
  });

  it("maps NOT_APPLICABLE FCF status without treating financial businesses as errors", () => {
    const response = callGetDividendAnalysis(service, "8306", {
      scoreVersion: "dividend-score-v1",
    });

    expect(resource.findOne).toHaveBeenCalledWith("8306", {
      scoreVersion: "dividend-score-v1",
    });
    expect(response).toMatchObject({
      symbolId: "8306",
      companyName: "三菱UFJ FG",
      scoreVersion: "dividend-score-v1",
      asOf: "2026-06-26",
      rank: 1,
      dividendScore: 91,
      metrics: {
        dividendYield: 3.3,
        freeCashFlow: null,
        freeCashFlowStatus: "NOT_APPLICABLE",
      },
      analysis: expect.any(Object),
      missingFields: ["freeCashFlow"],
      warnings: ["金融業はFCFの評価対象外のためN/A"],
    });
  });

  it("throws not found when the unified resource has no dividend analysis for the symbolId", () => {
    resource.findOne.mockReturnValue(null);

    expect(() =>
      callGetDividendAnalysis(service, "9999", {
        scoreVersion: "dividend-score-v1",
      }),
    ).toThrow(NotFoundException);
  });

  it("returns the fixed AI summary DTO for the supported mock symbolId", () => {
    const response = callGetAiSummary(service, "8306");

    expect(response).toEqual({
      symbolId: "8306",
      companyName: "三菱UFJ FG",
      companyCode: "8306",
      tweetSummary: "配当方針と業績安定性への期待が多く見られます。",
      tweetSentimentScore: 0.72,
      commentSummary: "株主還元と金利影響への関心が集まっています。",
      commentSentimentScore: 0.64,
      investmentHints: "安定配当と金融環境の変化を合わせて確認する。",
      investmentIssues: "金利変動や与信費用の増加に注意する。",
    });
  });

  it("throws not found when AI summary is unavailable for the symbolId", () => {
    expect(() => callGetAiSummary(service, "9999")).toThrow(NotFoundException);
  });
});
