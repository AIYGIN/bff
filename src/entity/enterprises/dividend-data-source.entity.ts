export interface HighDividendCandidateEntity {
  symbolId: string;
  rank: number;
}

export interface JQuantsEnterpriseDataEntity {
  symbolId: string;
  companyName: string;
  market: string | null;
  sector: string | null;
  dividendYield: number | null;
  payoutRatio: number | null;
  per: number | null;
  pbr: number | null;
  roe: number | null;
  equityRatio: number | null;
  edinetCode: string | null;
  fiscalYear: number | null;
  fiscalPeriodEnd: string | null;
  asOf: string;
}

export interface EdinetFinancialDataEntity {
  edinetCode: string;
  freeCashFlow: number | null;
  freeCashFlowStatus: "AVAILABLE" | "NOT_APPLICABLE" | "MISSING";
  asOf: string | null;
  warnings: string[];
  notAvailableReason: string | null;
}
