import {
  EdinetEnterpriseFilingResource,
  extractFreeCashFlow,
} from "./edinet-enterprise-filing.resource";

describe("EdinetEnterpriseFilingResource", () => {
  it("extracts free cash flow from operating and investing cash flow facts", () => {
    expect(
      extractFreeCashFlow(`
        <jpcrp_cor:NetCashProvidedByUsedInOperatingActivities>1000</jpcrp_cor:NetCashProvidedByUsedInOperatingActivities>
        <jpcrp_cor:NetCashProvidedByUsedInInvestmentActivities>-400</jpcrp_cor:NetCashProvidedByUsedInInvestmentActivities>
      `),
    ).toBe(600);
  });

  it("returns NOT_APPLICABLE without HTTP access for financial sectors", async () => {
    const httpService = { get: jest.fn() };
    const resource = new EdinetEnterpriseFilingResource(
      httpService as never,
      {
        edinetApiKey: "secret",
        edinetApiBaseUrl: "https://example.com/api/",
        enterpriseDataFetchTimeoutMs: 1000,
      } as never,
    );

    await expect(
      resource.fetchFinancialData("E03606", "2026-06-30", "銀行業"),
    ).resolves.toEqual({
      edinetCode: "E03606",
      freeCashFlow: null,
      freeCashFlowStatus: "NOT_APPLICABLE",
      asOf: "2026-06-30",
      warnings: ["financial_sector_fcf_na"],
      notAvailableReason: "金融業のためFCFはN/A",
    });
    expect(httpService.get).not.toHaveBeenCalled();
  });
});
