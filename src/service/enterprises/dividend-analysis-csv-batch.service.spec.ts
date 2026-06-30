import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DividendAnalysisCsvBatchService } from "./dividend-analysis-csv-batch.service";

describe("DividendAnalysisCsvBatchService", () => {
  it("generates deterministic unified CSV from provider resources", async () => {
    const directory = mkdtempSync(join(tmpdir(), "dividend-csv-"));
    const outputPath = join(directory, "generated", "unified.csv");
    const rawDir = join(directory, "raw");
    const service = new DividendAnalysisCsvBatchService(
      {
        enterpriseDividendAnalysisCsvPath: outputPath,
        enterpriseDividendRawDir: rawDir,
        enterpriseDividendScoreVersion: "dividend-score-v1",
      } as never,
      {
        fetchTopCandidates: jest
          .fn()
          .mockResolvedValue([{ symbolId: "2914", rank: 1 }]),
      } as never,
      {
        fetchEnterpriseData: jest.fn().mockResolvedValue([
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
        ]),
      } as never,
      {
        fetchFinancialData: jest.fn().mockResolvedValue({
          edinetCode: "E00492",
          freeCashFlow: 1234567890,
          freeCashFlowStatus: "AVAILABLE",
          asOf: "2026-06-30",
          warnings: [],
          notAvailableReason: null,
        }),
      } as never,
    );

    await expect(service.updateCsv()).resolves.toEqual({
      candidateCount: 1,
      outputPath,
    });
    const csv = readFileSync(outputPath, "utf8");
    expect(csv).toContain(
      "scoreVersion,symbolId,companyName,market,sector,rank,dividendScore",
    );
    expect(csv).toContain("dividend-score-v1,2914,日本たばこ産業");
    expect(csv).toContain("1234567890,AVAILABLE");
    expect(csv).toContain("notAvailableReason");
    expect(
      readFileSync(join(rawDir, "latest-candidates.json"), "utf8"),
    ).toContain("2914");
  });

  it("keeps TODO reason in CSV-only metadata while numeric required fields remain importable", async () => {
    const directory = mkdtempSync(join(tmpdir(), "dividend-csv-"));
    const outputPath = join(directory, "generated", "unified.csv");
    const service = new DividendAnalysisCsvBatchService(
      {
        enterpriseDividendAnalysisCsvPath: outputPath,
        enterpriseDividendRawDir: join(directory, "raw"),
        enterpriseDividendScoreVersion: "dividend-score-v1",
      } as never,
      {
        fetchTopCandidates: jest
          .fn()
          .mockResolvedValue([{ symbolId: "9999", rank: 1 }]),
      } as never,
      { fetchEnterpriseData: jest.fn().mockResolvedValue([]) } as never,
      { fetchFinancialData: jest.fn() } as never,
    );

    await service.updateCsv();

    const csv = readFileSync(outputPath, "utf8");
    expect(csv).toContain("9999,TODO:企業名要確認");
    expect(csv).toContain("MISSING");
    expect(csv).toContain("TODO:J-Quants取得結果要確認");
    expect(csv).toContain(",0,0,");
  });
});
