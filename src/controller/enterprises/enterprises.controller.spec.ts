import { Test, TestingModule } from "@nestjs/testing";

import { JwtAuthGuard } from "../../guard/jwt-auth.guard";
import { EnterprisesService } from "../../service/enterprises/enterprises.service";
import { EnterprisesController } from "./enterprises.controller";

type EnterprisesServiceMock = Pick<EnterprisesService, "getQuantsInfo">;

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
});
