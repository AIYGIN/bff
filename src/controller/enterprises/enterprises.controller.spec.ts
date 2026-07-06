import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";

import { JwtAuthGuard } from "../../guard/jwt-auth.guard";
import { EnterprisesService } from "../../service/enterprises/enterprises.service";
import { EnterprisesController } from "./enterprises.controller";

type EnterprisesServiceMock = Pick<
  EnterprisesService,
  "getQuantsInfo" | "getDividendAnalysis"
>;

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

describe("EnterprisesController", () => {
  let controller: EnterprisesController;
  let enterprisesService: jest.Mocked<EnterprisesServiceMock>;

  beforeEach(async () => {
    enterprisesService = {
      getQuantsInfo: jest.fn().mockReturnValue(quantsInfoResponse),
      getDividendAnalysis: jest.fn().mockReturnValue(dividendAnalysisResponse),
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
});
