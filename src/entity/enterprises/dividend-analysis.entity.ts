export type FreeCashFlowStatus = "AVAILABLE" | "NOT_APPLICABLE" | "MISSING";

export type DividendAnalysisWarning = string;

export interface DividendAnalysisMetricsEntity {
  dividendYield: number;
  payoutRatio: number | null;
  per: number | null;
  pbr: number | null;
  roe: number | null;
  equityRatio: number | null;
  freeCashFlow: number | null;
  freeCashFlowStatus: FreeCashFlowStatus;
}

export interface DividendAnalysisEntity {
  scoreVersion: string;
  symbolId: string;
  companyName: string;
  market: string | null;
  sector: string | null;
  rank: number;
  dividendScore: number;
  metrics: DividendAnalysisMetricsEntity;
  edinetCode: string | null;
  fiscalYear: number | null;
  fiscalPeriodEnd: string | null;
  jquantsAsOf: string;
  edinetAsOf: string | null;
  missingFields: string[];
  warnings: DividendAnalysisWarning[];
}
