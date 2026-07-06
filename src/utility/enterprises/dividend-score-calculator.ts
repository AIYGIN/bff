import type { DividendAnalysisEntity } from "../../entity/enterprises/dividend-analysis.entity";

export interface DividendAnalysisResult {
  summary: string;
  positiveFactors: string[];
  riskFactors: string[];
}

export const calculateDividendAnalysis = (
  entity: DividendAnalysisEntity,
): DividendAnalysisResult => {
  const positiveFactors: string[] = [];
  const riskFactors: string[] = [];

  if (entity.metrics.dividendYield >= 4) {
    positiveFactors.push("配当利回りが高い");
  }

  if (entity.metrics.pbr !== null && entity.metrics.pbr < 1) {
    positiveFactors.push("PBR が低め");
  }

  if (entity.metrics.payoutRatio !== null && entity.metrics.payoutRatio >= 70) {
    riskFactors.push("配当性向が高め");
  }

  if (entity.metrics.freeCashFlowStatus === "MISSING") {
    riskFactors.push("フリーキャッシュフローが欠損");
  }

  const summary =
    entity.metrics.freeCashFlowStatus === "NOT_APPLICABLE"
      ? "金融業のため FCF は N/A として評価"
      : "高配当利回りと財務健全性を総合評価";

  return {
    summary,
    positiveFactors,
    riskFactors,
  };
};
