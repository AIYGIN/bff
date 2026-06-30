import { UnifiedCsvEnterpriseDividendAnalysisResource } from "./unified-csv-enterprise-dividend-analysis.resource";

type CsvRow = Record<string, string>;

const headers = [
  "scoreVersion",
  "symbolId",
  "companyName",
  "market",
  "sector",
  "rank",
  "dividendScore",
  "dividendYield",
  "payoutRatio",
  "per",
  "pbr",
  "roe",
  "equityRatio",
  "freeCashFlow",
  "freeCashFlowStatus",
  "edinetCode",
  "fiscalYear",
  "fiscalPeriodEnd",
  "jquantsAsOf",
  "edinetAsOf",
  "missingFields",
  "warnings",
] as const;

const quoteCsv = (value: string): string => `"${value.replaceAll('"', '""')}"`;

const validRow = (overrides: Partial<CsvRow> = {}): CsvRow => ({
  scoreVersion: "dividend-score-v1",
  symbolId: "8306",
  companyName: "三菱UFJ FG",
  market: "Prime",
  sector: "銀行業",
  rank: "1",
  dividendScore: "91",
  dividendYield: "3.3",
  payoutRatio: "42.1",
  per: "10.8",
  pbr: "0.9",
  roe: "8.5",
  equityRatio: "4.9",
  freeCashFlow: "",
  freeCashFlowStatus: "NOT_APPLICABLE",
  edinetCode: "E03606",
  fiscalYear: "2025",
  fiscalPeriodEnd: "2025-03-31",
  jquantsAsOf: "2026-06-26",
  edinetAsOf: "2026-06-26",
  missingFields: '["freeCashFlow"]',
  warnings: '["financial_sector_fcf_na"]',
  ...overrides,
});

const csvFromRows = (rows: CsvRow[]): string =>
  [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((header) => quoteCsv(row[header] ?? "")).join(","),
    ),
  ].join("\n");

const createResource = (
  rows: CsvRow[],
): UnifiedCsvEnterpriseDividendAnalysisResource =>
  new UnifiedCsvEnterpriseDividendAnalysisResource(csvFromRows(rows));

const expectValidationColumn = (
  action: () => unknown,
  column: string,
): void => {
  try {
    action();
  } catch (error) {
    const response = (error as { getResponse?: () => unknown }).getResponse?.();
    expect(response).toMatchObject({ column });
    return;
  }

  throw new Error(`Expected validation error for ${column}`);
};

describe("UnifiedCsvEnterpriseDividendAnalysisResource", () => {
  it("converts unified CSV rows into normalized dividend analysis entities", () => {
    const resource = createResource([validRow()]);

    expect(
      resource.findMany({ scoreVersion: "dividend-score-v1" }),
    ).toMatchObject([
      {
        scoreVersion: "dividend-score-v1",
        symbolId: "8306",
        companyName: "三菱UFJ FG",
        rank: 1,
        dividendScore: 91,
        metrics: {
          dividendYield: 3.3,
          freeCashFlow: null,
          freeCashFlowStatus: "NOT_APPLICABLE",
        },
        jquantsAsOf: "2026-06-26",
        missingFields: ["freeCashFlow"],
        warnings: ["financial_sector_fcf_na"],
      },
    ]);
  });

  it("rejects rows missing required unified CSV fields", () => {
    const requiredFields = [
      "scoreVersion",
      "symbolId",
      "companyName",
      "rank",
      "dividendScore",
      "dividendYield",
      "jquantsAsOf",
    ] as const;

    for (const field of requiredFields) {
      const resource = createResource([validRow({ [field]: "" })]);

      expectValidationColumn(
        () => resource.findMany({ scoreVersion: "dividend-score-v1" }),
        field,
      );
    }
  });

  it("rejects out-of-range rank and dividendScore values", () => {
    expectValidationColumn(
      () =>
        createResource([validRow({ rank: "0" })]).findMany({
          scoreVersion: "dividend-score-v1",
        }),
      "rank",
    );
    expectValidationColumn(
      () =>
        createResource([validRow({ dividendScore: "-1" })]).findMany({
          scoreVersion: "dividend-score-v1",
        }),
      "dividendScore",
    );
    expectValidationColumn(
      () =>
        createResource([validRow({ dividendScore: "101" })]).findMany({
          scoreVersion: "dividend-score-v1",
        }),
      "dividendScore",
    );
  });

  it("rejects duplicate 1-based ranks per scoreVersion", () => {
    expectValidationColumn(
      () =>
        createResource([
          validRow(),
          validRow({ symbolId: "8316", companyName: "三井住友FG" }),
        ]).findMany({ scoreVersion: "dividend-score-v1" }),
      "rank",
    );
  });

  it("rejects unknown freeCashFlowStatus enum values", () => {
    expectValidationColumn(
      () =>
        createResource([validRow({ freeCashFlowStatus: "FCF_NA" })]).findMany({
          scoreVersion: "dividend-score-v1",
        }),
      "freeCashFlowStatus",
    );
  });

  it("does not treat NOT_APPLICABLE free cash flow as an import error", () => {
    const resource = createResource([validRow()]);

    expect(resource.findMany({ scoreVersion: "dividend-score-v1" })).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          symbolId: "8306",
          metrics: expect.objectContaining({
            freeCashFlow: null,
            freeCashFlowStatus: "NOT_APPLICABLE",
          }),
          missingFields: ["freeCashFlow"],
          warnings: ["financial_sector_fcf_na"],
        }),
      ]),
    );
  });

  it("finds one normalized detail by symbolId and scoreVersion", () => {
    const resource = createResource([validRow()]);

    expect(
      resource.findOne("8306", { scoreVersion: "dividend-score-v1" }),
    ).toMatchObject({
      symbolId: "8306",
      companyName: "三菱UFJ FG",
      scoreVersion: "dividend-score-v1",
      jquantsAsOf: "2026-06-26",
      rank: 1,
      dividendScore: 91,
      metrics: {
        freeCashFlow: null,
        freeCashFlowStatus: "NOT_APPLICABLE",
      },
      missingFields: ["freeCashFlow"],
      warnings: ["financial_sector_fcf_na"],
    });
  });
});
