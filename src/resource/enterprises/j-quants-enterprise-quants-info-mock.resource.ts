import { Injectable } from "@nestjs/common";

import type {
  EnterpriseDividendAnalysisEntity,
  EnterpriseQuantInfoEntity,
} from "../../entity/enterprise-quants-info.entity";

const UPDATED_AT = "2026-06-26T00:00:00.000Z";
const DATA_AS_OF_DATE = "2026-06-26";

type MockCompany = Pick<
  EnterpriseQuantInfoEntity,
  | "symbolId"
  | "companyName"
  | "sector"
  | "latestDividendYield"
  | "isFinancialBusiness"
>;

const companies: MockCompany[] = [
  {
    symbolId: "9432",
    companyName: "NTT",
    sector: "情報・通信業",
    latestDividendYield: 3.7,
    isFinancialBusiness: false,
  },
  {
    symbolId: "9433",
    companyName: "KDDI",
    sector: "情報・通信業",
    latestDividendYield: 3.6,
    isFinancialBusiness: false,
  },
  {
    symbolId: "9434",
    companyName: "ソフトバンク",
    sector: "情報・通信業",
    latestDividendYield: 4.5,
    isFinancialBusiness: false,
  },
  {
    symbolId: "8058",
    companyName: "三菱商事",
    sector: "商社",
    latestDividendYield: 3.5,
    isFinancialBusiness: false,
  },
  {
    symbolId: "8001",
    companyName: "伊藤忠商事",
    sector: "商社",
    latestDividendYield: 3.1,
    isFinancialBusiness: false,
  },
  {
    symbolId: "8031",
    companyName: "三井物産",
    sector: "商社",
    latestDividendYield: 3.4,
    isFinancialBusiness: false,
  },
  {
    symbolId: "8053",
    companyName: "住友商事",
    sector: "商社",
    latestDividendYield: 3.8,
    isFinancialBusiness: false,
  },
  {
    symbolId: "8002",
    companyName: "丸紅",
    sector: "商社",
    latestDividendYield: 3.2,
    isFinancialBusiness: false,
  },
  {
    symbolId: "8306",
    companyName: "三菱UFJ FG",
    sector: "銀行業",
    latestDividendYield: 3.3,
    isFinancialBusiness: true,
  },
  {
    symbolId: "8316",
    companyName: "三井住友FG",
    sector: "銀行業",
    latestDividendYield: 3.6,
    isFinancialBusiness: true,
  },
  {
    symbolId: "8411",
    companyName: "みずほFG",
    sector: "銀行業",
    latestDividendYield: 3.9,
    isFinancialBusiness: true,
  },
  {
    symbolId: "8766",
    companyName: "東京海上HD",
    sector: "保険業",
    latestDividendYield: 3.0,
    isFinancialBusiness: true,
  },
  {
    symbolId: "8725",
    companyName: "MS&AD",
    sector: "保険業",
    latestDividendYield: 3.4,
    isFinancialBusiness: true,
  },
  {
    symbolId: "1928",
    companyName: "積水ハウス",
    sector: "建設業",
    latestDividendYield: 3.5,
    isFinancialBusiness: false,
  },
  {
    symbolId: "8591",
    companyName: "オリックス",
    sector: "その他金融業",
    latestDividendYield: 3.2,
    isFinancialBusiness: true,
  },
  {
    symbolId: "2914",
    companyName: "JT",
    sector: "食料品",
    latestDividendYield: 4.8,
    isFinancialBusiness: false,
  },
  {
    symbolId: "1605",
    companyName: "INPEX",
    sector: "鉱業",
    latestDividendYield: 3.6,
    isFinancialBusiness: false,
  },
  {
    symbolId: "5020",
    companyName: "ENEOS HD",
    sector: "石油・石炭製品",
    latestDividendYield: 3.3,
    isFinancialBusiness: false,
  },
  {
    symbolId: "4502",
    companyName: "武田薬品工業",
    sector: "医薬品",
    latestDividendYield: 4.4,
    isFinancialBusiness: false,
  },
  {
    symbolId: "5401",
    companyName: "日本製鉄",
    sector: "鉄鋼",
    latestDividendYield: 4.1,
    isFinancialBusiness: false,
  },
];

const buildEnterprise = (
  company: MockCompany,
  index: number,
): EnterpriseQuantInfoEntity => {
  const rank = index + 1;
  const isFcfNotApplicable = company.isFinancialBusiness;
  const totalScore = Math.max(66, 92 - index);
  const safetyLabel =
    totalScore >= 84 ? "safe" : totalScore >= 74 ? "neutral" : "watch";
  const judgement =
    safetyLabel === "safe"
      ? "安全寄り"
      : safetyLabel === "neutral"
        ? "中立"
        : "要確認";

  return {
    ...company,
    rank,
    totalScore,
    judgement,
    safetyLabel,
    scoreBreakdown: {
      fcf: {
        score: isFcfNotApplicable ? 0 : Math.max(18, 30 - (index % 5) * 2),
        maxScore: 30,
        isNotApplicable: isFcfNotApplicable,
      },
      dividendCutHistory: {
        score: Math.max(14, 20 - (index % 4)),
        maxScore: 20,
        periodYears: 10,
      },
      dividendGrowth: {
        score: Math.max(8, 12 - (index % 5)),
        maxScore: 15,
        periodYears: 10,
      },
      payoutRatio: {
        score: Math.max(9, 15 - (index % 4)),
        maxScore: 15,
      },
      dividendYield: {
        score: Math.max(6, 8 - (index % 3)),
        maxScore: 10,
      },
      financialMetrics: {
        score: Math.max(5, 7 - (index % 3)),
        maxScore: 10,
      },
    },
    isFcfNotApplicable,
    updatedAt: UPDATED_AT,
    dataAsOfDate: DATA_AS_OF_DATE,
  };
};

const buildDividendAnalysis = (
  company: MockCompany,
  index: number,
): EnterpriseDividendAnalysisEntity => {
  const enterprise = buildEnterprise(company, index);
  const dividendGrowthRate10y = Number((11.2 - index).toFixed(1));
  const isFcfNotApplicable = company.isFinancialBusiness;

  return {
    symbolId: enterprise.symbolId,
    companyName: enterprise.companyName,
    sector: enterprise.sector,
    totalScore: enterprise.totalScore,
    judgement: enterprise.judgement,
    safetyLabel: enterprise.safetyLabel,
    metrics: {
      fcf: isFcfNotApplicable ? null : 150000000 - index * 10000000,
      payoutRatio: Number((39.4 + index * 0.5).toFixed(1)),
      dividendGrowthRate10y,
      dividendCutCount10y: 0,
      per: Number((10.6 + index * 0.3).toFixed(1)),
      pbr: Number(Math.max(0.6, 1.2 - index * 0.1).toFixed(1)),
      roe: Number(Math.max(5.5, 13.3 - index).toFixed(1)),
    },
    scoreBreakdown: {
      fcf: {
        score: isFcfNotApplicable ? null : enterprise.scoreBreakdown.fcf.score,
        maxScore: enterprise.scoreBreakdown.fcf.maxScore,
        isNotApplicable: isFcfNotApplicable,
        reason: isFcfNotApplicable
          ? "金融業はFCFの評価対象外のためN/A"
          : "3年連続プラス",
      },
      dividendCutHistory: {
        ...enterprise.scoreBreakdown.dividendCutHistory,
        reason: "過去10年で減配なし",
      },
      dividendGrowth: {
        ...enterprise.scoreBreakdown.dividendGrowth,
        reason: `年平均+${dividendGrowthRate10y}%`,
      },
      payoutRatio: {
        ...enterprise.scoreBreakdown.payoutRatio,
        reason: "健全な水準",
      },
      dividendYield: {
        ...enterprise.scoreBreakdown.dividendYield,
        reason: "目安レンジ内",
      },
      financialMetrics: {
        ...enterprise.scoreBreakdown.financialMetrics,
        reason: "PER/PBR/ROEから補助判定",
      },
    },
    isFinancialBusiness: enterprise.isFinancialBusiness,
    isFcfNotApplicable,
    updatedAt: UPDATED_AT,
    dataAsOfDate: DATA_AS_OF_DATE,
  };
};

@Injectable()
export class JQuantsEnterpriseQuantsInfoMockResource {
  findManyFromJQuantsApiMock(): EnterpriseQuantInfoEntity[] {
    return companies.map(buildEnterprise);
  }

  findOneDividendAnalysisFromJQuantsApiMock(
    symbolId: string,
  ): EnterpriseDividendAnalysisEntity | null {
    const index = companies.findIndex(
      (company) => company.symbolId === symbolId,
    );

    return index === -1 ? null : buildDividendAnalysis(companies[index], index);
  }
}
