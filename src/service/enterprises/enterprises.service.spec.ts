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
});
