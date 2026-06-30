import { Injectable } from "@nestjs/common";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { AppConfigService } from "../../common/config/app-config.service";
import type {
  EdinetFinancialDataEntity,
  HighDividendCandidateEntity,
  JQuantsEnterpriseDataEntity,
} from "../../entity/enterprises/dividend-data-source.entity";
import { EdinetEnterpriseFilingResource } from "../../resource/edinet/edinet-enterprise-filing.resource";
import { JQuantsEnterpriseDataResource } from "../../resource/jquants/j-quants-enterprise-data.resource";

interface GeneratedDividendAnalysisCsvRow {
  scoreVersion: string;
  symbolId: string;
  companyName: string;
  market: string;
  sector: string;
  rank: string;
  dividendScore: string;
  dividendYield: string;
  payoutRatio: string;
  per: string;
  pbr: string;
  roe: string;
  equityRatio: string;
  freeCashFlow: string;
  freeCashFlowStatus: string;
  edinetCode: string;
  fiscalYear: string;
  fiscalPeriodEnd: string;
  jquantsAsOf: string;
  edinetAsOf: string;
  missingFields: string;
  warnings: string;
  notAvailableReason: string;
}

export interface UpdateDividendAnalysisCsvResult {
  candidateCount: number;
  outputPath: string;
}

const CSV_HEADERS: Array<keyof GeneratedDividendAnalysisCsvRow> = [
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
  "notAvailableReason",
];

@Injectable()
export class DividendAnalysisCsvBatchService {
  constructor(
    private readonly config: AppConfigService,
    private readonly jquantsResource: JQuantsEnterpriseDataResource,
    private readonly edinetResource: EdinetEnterpriseFilingResource,
  ) {}

  async updateCsv(): Promise<UpdateDividendAnalysisCsvResult> {
    const asOf = new Date().toISOString().slice(0, 10);
    const candidates = readCandidateCsv(
      this.config.highDividendCandidateCsvPath,
      50,
    );
    const jquantsData = await this.jquantsResource.fetchEnterpriseData(
      candidates.map((candidate) => candidate.symbolId),
      asOf,
    );
    const jquantsBySymbol = new Map(
      jquantsData.map((entity) => [entity.symbolId, entity]),
    );
    const rows: GeneratedDividendAnalysisCsvRow[] = [];

    for (const candidate of candidates) {
      const jquants = jquantsBySymbol.get(candidate.symbolId);
      if (jquants === undefined) {
        rows.push(
          this.missingJQuantsRow(candidate.symbolId, candidate.rank, asOf),
        );
        continue;
      }
      const edinet = await this.edinetResource.fetchFinancialData(
        jquants.edinetCode,
        asOf,
        jquants.sector,
      );
      rows.push(this.toCsvRow(candidate.rank, jquants, edinet));
    }

    const outputPath = this.config.enterpriseDividendAnalysisCsvPath;
    mkdirSync(dirname(outputPath), { recursive: true });
    mkdirSync(this.config.enterpriseDividendRawDir, { recursive: true });
    writeFileSync(outputPath, csvFromRows(rows), "utf8");
    writeFileSync(
      join(this.config.enterpriseDividendRawDir, "latest-candidates.json"),
      JSON.stringify({
        asOf,
        symbols: candidates.map((item) => item.symbolId),
      }),
      "utf8",
    );

    return {
      candidateCount: candidates.length,
      outputPath,
    };
  }

  private toCsvRow(
    rank: number,
    jquants: JQuantsEnterpriseDataEntity,
    edinet: EdinetFinancialDataEntity,
  ): GeneratedDividendAnalysisCsvRow {
    const missingFields = missingFieldsFor(jquants, edinet);
    const warnings = [...edinet.warnings];
    if (
      missingFields.length > 0 &&
      !warnings.includes("manual_review_required")
    ) {
      warnings.push("manual_review_required");
    }

    return {
      scoreVersion: this.config.enterpriseDividendScoreVersion,
      symbolId: jquants.symbolId,
      companyName: jquants.companyName,
      market: jquants.market ?? "",
      sector: jquants.sector ?? "",
      rank: String(rank),
      dividendScore: formatNumber(calculateDividendScore(jquants, edinet)),
      dividendYield: nullableRequiredNumber(jquants.dividendYield),
      payoutRatio: nullableNumber(jquants.payoutRatio),
      per: nullableNumber(jquants.per),
      pbr: nullableNumber(jquants.pbr),
      roe: nullableNumber(jquants.roe),
      equityRatio: nullableNumber(jquants.equityRatio),
      freeCashFlow: nullableNumber(edinet.freeCashFlow),
      freeCashFlowStatus: edinet.freeCashFlowStatus,
      edinetCode: jquants.edinetCode ?? "",
      fiscalYear: jquants.fiscalYear === null ? "" : String(jquants.fiscalYear),
      fiscalPeriodEnd: jquants.fiscalPeriodEnd ?? "",
      jquantsAsOf: jquants.asOf,
      edinetAsOf: edinet.asOf ?? "",
      missingFields: JSON.stringify(missingFields),
      warnings: JSON.stringify(warnings),
      notAvailableReason: edinet.notAvailableReason ?? "",
    };
  }

  private missingJQuantsRow(
    symbolId: string,
    rank: number,
    asOf: string,
  ): GeneratedDividendAnalysisCsvRow {
    const missingFields = ["companyName", "dividendYield"];
    return {
      scoreVersion: this.config.enterpriseDividendScoreVersion,
      symbolId,
      companyName: "TODO:企業名要確認",
      market: "",
      sector: "",
      rank: String(rank),
      dividendScore: "0",
      dividendYield: "0",
      payoutRatio: "",
      per: "",
      pbr: "",
      roe: "",
      equityRatio: "",
      freeCashFlow: "",
      freeCashFlowStatus: "MISSING",
      edinetCode: "",
      fiscalYear: "",
      fiscalPeriodEnd: "",
      jquantsAsOf: asOf,
      edinetAsOf: "",
      missingFields: JSON.stringify(missingFields),
      warnings: JSON.stringify(["manual_review_required"]),
      notAvailableReason: "TODO:J-Quants取得結果要確認",
    };
  }
}

export const csvFromRows = (rows: GeneratedDividendAnalysisCsvRow[]): string =>
  [
    CSV_HEADERS.join(","),
    ...rows.map((row) =>
      CSV_HEADERS.map((header) => quoteCsv(row[header])).join(","),
    ),
  ].join("\n");

const quoteCsv = (value: string): string =>
  /[",\n\r]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;

export const parseCandidateText = (
  text: string,
): HighDividendCandidateEntity[] => {
  const seen = new Set<string>();
  const candidates: HighDividendCandidateEntity[] = [];
  for (const match of text.matchAll(/(?<!\d)(\d{4})(?!\d)/g)) {
    const symbolId = match[1];
    if (seen.has(symbolId)) {
      continue;
    }
    seen.add(symbolId);
    candidates.push({ symbolId, rank: candidates.length + 1 });
  }
  return candidates;
};

const readCandidateCsv = (
  candidateCsvPath: string,
  limit: number,
): HighDividendCandidateEntity[] =>
  parseCandidateText(readFileSync(candidateCsvPath, "utf8")).slice(0, limit);

const missingFieldsFor = (
  jquants: JQuantsEnterpriseDataEntity,
  edinet: EdinetFinancialDataEntity,
): string[] => {
  const missingFields: string[] = [];
  if (jquants.dividendYield === null) {
    missingFields.push("dividendYield");
  }
  if (edinet.freeCashFlowStatus === "MISSING") {
    missingFields.push("freeCashFlow");
  }
  return missingFields;
};

const calculateDividendScore = (
  jquants: JQuantsEnterpriseDataEntity,
  edinet: EdinetFinancialDataEntity,
): number => {
  const dividendYieldScore = Math.min((jquants.dividendYield ?? 0) * 12, 45);
  const payoutScore =
    jquants.payoutRatio === null
      ? 0
      : jquants.payoutRatio <= 60
        ? 20
        : jquants.payoutRatio <= 80
          ? 10
          : 0;
  const roeScore = Math.min(Math.max(jquants.roe ?? 0, 0), 15);
  const equityScore = Math.min(Math.max((jquants.equityRatio ?? 0) / 5, 0), 10);
  const fcfScore =
    edinet.freeCashFlowStatus === "AVAILABLE" && (edinet.freeCashFlow ?? 0) > 0
      ? 10
      : edinet.freeCashFlowStatus === "NOT_APPLICABLE"
        ? 10
        : 0;
  return Math.min(
    100,
    Number(
      (
        dividendYieldScore +
        payoutScore +
        roeScore +
        equityScore +
        fcfScore
      ).toFixed(1),
    ),
  );
};

const nullableRequiredNumber = (value: number | null): string =>
  value === null ? "0" : formatNumber(value);

const nullableNumber = (value: number | null): string =>
  value === null ? "" : formatNumber(value);

const formatNumber = (value: number): string =>
  Number.isInteger(value)
    ? String(value)
    : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
