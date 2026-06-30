import { of } from "rxjs";
import { JQuantsEnterpriseDataResource } from "./j-quants-enterprise-data.resource";

describe("JQuantsEnterpriseDataResource", () => {
  it("maps J-Quants responses into internal enterprise data entities", async () => {
    const get = jest
      .fn()
      .mockReturnValueOnce(
        of({
          data: {
            info: [
              {
                Code: "2914",
                CompanyName: "日本たばこ産業",
                MarketCodeName: "Prime",
                Sector33CodeName: "食料品",
                EDINETCode: "E00492",
              },
            ],
          },
        }),
      )
      .mockReturnValueOnce(
        of({
          data: {
            daily_quotes: [
              {
                DividendYield: "4.85",
                PER: "14.2",
                PBR: "1.55",
              },
            ],
          },
        }),
      )
      .mockReturnValueOnce(
        of({
          data: {
            statements: [
              {
                PayoutRatio: "72.1",
                ROE: "10.8",
                EquityRatio: "52.3",
                FiscalYear: "2025",
                CurrentFiscalYearEndDate: "2025-12-31",
              },
            ],
          },
        }),
      );
    const resource = new JQuantsEnterpriseDataResource(
      { get } as never,
      {
        jquantsApiBaseUrl: "https://api.jquants.example/",
        jquantsIdToken: "token-value",
        enterpriseDataFetchTimeoutMs: 1000,
      } as never,
    );

    await expect(
      resource.fetchEnterpriseData(["2914"], "2026-06-30"),
    ).resolves.toEqual([
      {
        symbolId: "2914",
        companyName: "日本たばこ産業",
        market: "Prime",
        sector: "食料品",
        dividendYield: 4.85,
        payoutRatio: 72.1,
        per: 14.2,
        pbr: 1.55,
        roe: 10.8,
        equityRatio: 52.3,
        edinetCode: "E00492",
        fiscalYear: 2025,
        fiscalPeriodEnd: "2025-12-31",
        asOf: "2026-06-30",
      },
    ]);
    expect(get).toHaveBeenCalledWith(
      "https://api.jquants.example/v1/listed/info?code=2914",
      expect.objectContaining({
        headers: { Authorization: "Bearer token-value" },
        maxRedirects: 0,
      }),
    );
  });
});
