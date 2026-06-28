export type EnterpriseSafetyLabel = "safe" | "neutral" | "watch";

export type EnterpriseScoreEntity = {
  score: number;
  maxScore: number;
};

export type EnterpriseFcfScoreEntity = EnterpriseScoreEntity & {
  isNotApplicable: boolean;
};

export type EnterprisePeriodScoreEntity = EnterpriseScoreEntity & {
  periodYears: number;
};

export type EnterpriseScoreBreakdownEntity = {
  fcf: EnterpriseFcfScoreEntity;
  dividendCutHistory: EnterprisePeriodScoreEntity;
  dividendGrowth: EnterprisePeriodScoreEntity;
  payoutRatio: EnterpriseScoreEntity;
  dividendYield: EnterpriseScoreEntity;
  financialMetrics: EnterpriseScoreEntity;
};

export type EnterpriseQuantInfoEntity = {
  symbolId: string;
  companyName: string;
  sector: string;
  rank: number;
  totalScore: number;
  judgement: string;
  safetyLabel: EnterpriseSafetyLabel;
  scoreBreakdown: EnterpriseScoreBreakdownEntity;
  latestDividendYield: number;
  isFinancialBusiness: boolean;
  isFcfNotApplicable: boolean;
  updatedAt: string;
  dataAsOfDate: string;
};

export type EnterpriseDividendAnalysisMetricsEntity = {
  fcf: number | null;
  payoutRatio: number;
  dividendGrowthRate10y: number;
  dividendCutCount10y: number;
  per: number;
  pbr: number;
  roe: number;
};

export type EnterpriseDividendAnalysisScoreEntity = EnterpriseScoreEntity & {
  reason: string;
};

export type EnterpriseDividendAnalysisFcfScoreEntity = {
  score: number | null;
  maxScore: number;
  isNotApplicable: boolean;
  reason: string;
};

export type EnterpriseDividendAnalysisPeriodScoreEntity =
  EnterpriseDividendAnalysisScoreEntity & {
    periodYears: number;
  };

export type EnterpriseDividendAnalysisScoreBreakdownEntity = {
  fcf: EnterpriseDividendAnalysisFcfScoreEntity;
  dividendCutHistory: EnterpriseDividendAnalysisPeriodScoreEntity;
  dividendGrowth: EnterpriseDividendAnalysisPeriodScoreEntity;
  payoutRatio: EnterpriseDividendAnalysisScoreEntity;
  dividendYield: EnterpriseDividendAnalysisScoreEntity;
  financialMetrics: EnterpriseDividendAnalysisScoreEntity;
};

export type EnterpriseDividendAnalysisEntity = {
  symbolId: string;
  companyName: string;
  sector: string;
  totalScore: number;
  judgement: string;
  safetyLabel: EnterpriseSafetyLabel;
  metrics: EnterpriseDividendAnalysisMetricsEntity;
  scoreBreakdown: EnterpriseDividendAnalysisScoreBreakdownEntity;
  isFinancialBusiness: boolean;
  isFcfNotApplicable: boolean;
  updatedAt: string;
  dataAsOfDate: string;
};
