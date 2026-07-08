import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";

import { JwtAuthGuard } from "../../guard/jwt-auth.guard";
import { EnterprisesService } from "../../service/enterprises/enterprises.service";
import { EnterprisesController } from "./enterprises.controller";

type EnterprisesServiceMock = Pick<
  EnterprisesService,
  "getQuantsInfo" | "getDividendAnalysis"
> & {
  getAiSummary: jest.Mock;
};

const quantsInfoResponse = {
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
};

const dividendAnalysisResponse = {
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
  analysis: {
    freeCashFlowStatus: "NOT_APPLICABLE",
    reason: "金融業はFCFの評価対象外のためN/A",
  },
  missingFields: ["freeCashFlow"],
  warnings: ["金融業はFCFの評価対象外のためN/A"],
};

const aiSummaryResponse = {
  symbolId: "8306",
  companyName: "三菱UFJ FG",
  companyCode: "8306",
  tweetSummary: "配当方針と業績安定性への期待が多く見られます。",
  tweetSentimentScore: 0.72,
  commentSummary: "株主還元と金利影響への関心が集まっています。",
  commentSentimentScore: 0.64,
  investmentHints: "安定配当と金融環境の変化を合わせて確認する。",
  investmentIssues: "金利変動や与信費用の増加に注意する。",
};

const callGetQuantsInfo = (
  controller: EnterprisesController,
  query?: unknown,
): unknown =>
  (controller.getQuantsInfo as unknown as (query?: unknown) => unknown)(query);

const callGetDividendAnalysis = (
  controller: EnterprisesController,
  symbolId: string,
  query?: unknown,
): unknown =>
  (
    controller.getDividendAnalysis as unknown as (
      symbolId: string,
      query?: unknown,
    ) => unknown
  )(symbolId, query);

const callGetAiSummary = (
  controller: EnterprisesController,
  symbolId: string,
): unknown =>
  (
    controller as unknown as {
      getAiSummary: (symbolId: string) => unknown;
    }
  ).getAiSummary(symbolId);

describe("EnterprisesController", () => {
  let controller: EnterprisesController;
  let enterprisesService: jest.Mocked<EnterprisesServiceMock>;

  beforeEach(async () => {
    enterprisesService = {
      getQuantsInfo: jest.fn().mockReturnValue(quantsInfoResponse),
      getDividendAnalysis: jest.fn().mockReturnValue(dividendAnalysisResponse),
      getAiSummary: jest.fn().mockReturnValue(aiSummaryResponse),
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

  it("passes quantsInfo query DTO to its corresponding service and returns the DTO", () => {
    const response = callGetQuantsInfo(controller, {});

    expect(enterprisesService.getQuantsInfo).toHaveBeenCalledTimes(1);
    expect(enterprisesService.getQuantsInfo).toHaveBeenCalledWith({});
    expect(response).toBe(quantsInfoResponse);
  });

  it("passes quantsInfo sort, order, limit, and scoreVersion query to its corresponding service", () => {
    const query = {
      limit: 1,
      sort: "rank",
      order: "asc",
      scoreVersion: "dividend-score-v1",
    };

    const response = callGetQuantsInfo(controller, query);

    expect(enterprisesService.getQuantsInfo).toHaveBeenCalledWith(query);
    expect(response).toBe(quantsInfoResponse);
  });

  it("passes dividendAnalysis path and scoreVersion query to its corresponding service", () => {
    const response = callGetDividendAnalysis(controller, "8306", {
      scoreVersion: "dividend-score-v1",
    });

    expect(enterprisesService.getDividendAnalysis).toHaveBeenCalledTimes(1);
    expect(enterprisesService.getDividendAnalysis).toHaveBeenCalledWith(
      "8306",
      {
        scoreVersion: "dividend-score-v1",
      },
    );
    expect(response).toBe(dividendAnalysisResponse);
  });

  it("propagates not found from the corresponding service", () => {
    enterprisesService.getDividendAnalysis.mockImplementation(() => {
      throw new NotFoundException("Dividend analysis not found");
    });

    expect(() =>
      callGetDividendAnalysis(controller, "9999", {
        scoreVersion: "dividend-score-v1",
      }),
    ).toThrow(NotFoundException);
    expect(enterprisesService.getDividendAnalysis).toHaveBeenCalledWith(
      "9999",
      {
        scoreVersion: "dividend-score-v1",
      },
    );
  });

  it("rejects non-4-digit symbolId before calling the service", () => {
    expect(() => callGetDividendAnalysis(controller, "abc")).toThrow(
      BadRequestException,
    );
    expect(enterprisesService.getDividendAnalysis).not.toHaveBeenCalled();
  });

  it("passes aiSummary path to its corresponding service and returns the DTO", () => {
    const response = callGetAiSummary(controller, "8306");

    expect(enterprisesService.getAiSummary).toHaveBeenCalledTimes(1);
    expect(enterprisesService.getAiSummary).toHaveBeenCalledWith("8306");
    expect(response).toBe(aiSummaryResponse);
  });

  it("propagates aiSummary not found from the corresponding service", () => {
    enterprisesService.getAiSummary.mockImplementation(() => {
      throw new NotFoundException("AI summary not found");
    });

    expect(() => callGetAiSummary(controller, "9999")).toThrow(
      NotFoundException,
    );
    expect(enterprisesService.getAiSummary).toHaveBeenCalledWith("9999");
  });

  it("rejects non-4-digit aiSummary symbolId before calling the service", () => {
    expect(() => callGetAiSummary(controller, "abc")).toThrow(
      BadRequestException,
    );
    expect(enterprisesService.getAiSummary).not.toHaveBeenCalled();
  });
});
