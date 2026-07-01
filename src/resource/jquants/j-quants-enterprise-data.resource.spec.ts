import { of } from "rxjs";
import { JQuantsEnterpriseDataResource } from "./j-quants-enterprise-data.resource";

describe("JQuantsEnterpriseDataResource", () => {
  it("maps J-Quants responses into internal enterprise data entities", async () => {
    const get = jest
      .fn()
      .mockReturnValueOnce(
        of({
          data: {
            data: [
              {
                Code: "29140",
                CoName: "日本たばこ産業",
                MktNm: "プライム",
                S33Nm: "食料品",
              },
            ],
          },
        }),
      )
      .mockReturnValueOnce(
        of({
          data: {
            data: [
              {
                C: "4000",
                AdjC: "4000",
              },
            ],
          },
        }),
      )
      .mockReturnValueOnce(
        of({
          data: {
            data: [
              {
                EPS: "250",
                BPS: "2000",
                NP: "100",
                Eq: "1000",
                EqAR: "0.523",
                FDivAnn: "194",
                FPayoutRatioAnn: "72.1",
                CurFYEn: "2025-12-31",
              },
            ],
          },
        }),
      );
    const resource = new JQuantsEnterpriseDataResource(
      { get } as never,
      {
        jquantsApiBaseUrl: "https://api.jquants.example/",
        jquantsApiKey: "api-key-value",
        jquantsIdToken: null,
        enterpriseDataFetchTimeoutMs: 1000,
      } as never,
    );

    await expect(
      resource.fetchEnterpriseData(["2914"], "2026-06-30"),
    ).resolves.toEqual([
      {
        symbolId: "2914",
        companyName: "日本たばこ産業",
        market: "プライム",
        sector: "食料品",
        dividendYield: 4.85,
        payoutRatio: 72.1,
        per: 16,
        pbr: 2,
        roe: 10,
        equityRatio: 52.3,
        edinetCode: null,
        fiscalYear: 2025,
        fiscalPeriodEnd: "2025-12-31",
        asOf: "2026-06-30",
      },
    ]);
    expect(get).toHaveBeenNthCalledWith(
      1,
      "https://api.jquants.example/v2/equities/master",
      expect.objectContaining({
        headers: { "x-api-key": "api-key-value" },
        maxRedirects: 0,
      }),
    );
    expect(get).toHaveBeenNthCalledWith(
      2,
      "https://api.jquants.example/v2/equities/bars/daily?code=2914",
      expect.objectContaining({
        headers: { "x-api-key": "api-key-value" },
        maxRedirects: 0,
      }),
    );
    expect(get).toHaveBeenNthCalledWith(
      3,
      "https://api.jquants.example/v2/fins/summary?code=2914",
      expect.objectContaining({
        headers: { "x-api-key": "api-key-value" },
        maxRedirects: 0,
      }),
    );
  });
});
