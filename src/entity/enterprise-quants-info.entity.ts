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
