import { ApiProperty } from "@nestjs/swagger";

type EnterpriseDividendAnalysisSafetyLabel = "safe" | "neutral" | "watch";

export class EnterpriseDividendAnalysisMetricsDto {
  @ApiProperty({
    description: "フリーキャッシュフロー。金融業では null",
    example: 123456789,
    nullable: true,
    type: Number,
  })
  fcf: number | null;

  @ApiProperty({
    description: "配当性向",
    example: 41.3,
  })
  payoutRatio: number;

  @ApiProperty({
    description: "10年配当成長率",
    example: 11.2,
  })
  dividendGrowthRate10y: number;

  @ApiProperty({
    description: "10年減配回数",
    example: 0,
    minimum: 0,
  })
  dividendCutCount10y: number;

  @ApiProperty({
    description: "PER",
    example: 11.2,
  })
  per: number;

  @ApiProperty({
    description: "PBR",
    example: 1.2,
  })
  pbr: number;

  @ApiProperty({
    description: "ROE",
    example: 13.3,
  })
  roe: number;

  constructor(args: EnterpriseDividendAnalysisMetricsDto) {
    this.fcf = args.fcf;
    this.payoutRatio = args.payoutRatio;
    this.dividendGrowthRate10y = args.dividendGrowthRate10y;
    this.dividendCutCount10y = args.dividendCutCount10y;
    this.per = args.per;
    this.pbr = args.pbr;
    this.roe = args.roe;
  }
}

class EnterpriseDividendAnalysisScoreDto {
  @ApiProperty({
    description: "スコア",
    example: 15,
    minimum: 0,
  })
  score: number;

  @ApiProperty({
    description: "最大スコア",
    example: 15,
    minimum: 0,
  })
  maxScore: number;

  @ApiProperty({
    description: "判定理由",
    example: "健全な水準",
  })
  reason: string;

  constructor(args: EnterpriseDividendAnalysisScoreDto) {
    this.score = args.score;
    this.maxScore = args.maxScore;
    this.reason = args.reason;
  }
}

export class EnterpriseDividendAnalysisFcfScoreDto {
  @ApiProperty({
    description: "FCF スコア。金融業では null",
    example: 30,
    minimum: 0,
    nullable: true,
    type: Number,
  })
  score: number | null;

  @ApiProperty({
    description: "最大スコア",
    example: 30,
    minimum: 0,
  })
  maxScore: number;

  @ApiProperty({
    description: "FCF 評価対象外かどうか",
    example: false,
  })
  isNotApplicable: boolean;

  @ApiProperty({
    description: "判定理由",
    example: "3年連続プラス",
  })
  reason: string;

  constructor(args: EnterpriseDividendAnalysisFcfScoreDto) {
    this.score = args.score;
    this.maxScore = args.maxScore;
    this.isNotApplicable = args.isNotApplicable;
    this.reason = args.reason;
  }
}

class EnterpriseDividendAnalysisPeriodScoreDto extends EnterpriseDividendAnalysisScoreDto {
  @ApiProperty({
    description: "評価対象期間（年）",
    example: 10,
    minimum: 0,
  })
  periodYears: number;

  constructor(args: EnterpriseDividendAnalysisPeriodScoreDto) {
    super(args);
    this.periodYears = args.periodYears;
  }
}

export class EnterpriseDividendAnalysisScoreBreakdownDto {
  @ApiProperty({
    description: "フリーキャッシュフロー評価",
    type: EnterpriseDividendAnalysisFcfScoreDto,
  })
  fcf: EnterpriseDividendAnalysisFcfScoreDto;

  @ApiProperty({
    description: "減配履歴評価",
    type: EnterpriseDividendAnalysisPeriodScoreDto,
  })
  dividendCutHistory: EnterpriseDividendAnalysisPeriodScoreDto;

  @ApiProperty({
    description: "増配傾向評価",
    type: EnterpriseDividendAnalysisPeriodScoreDto,
  })
  dividendGrowth: EnterpriseDividendAnalysisPeriodScoreDto;

  @ApiProperty({
    description: "配当性向評価",
    type: EnterpriseDividendAnalysisScoreDto,
  })
  payoutRatio: EnterpriseDividendAnalysisScoreDto;

  @ApiProperty({
    description: "配当利回り評価",
    type: EnterpriseDividendAnalysisScoreDto,
  })
  dividendYield: EnterpriseDividendAnalysisScoreDto;

  @ApiProperty({
    description: "財務指標評価",
    type: EnterpriseDividendAnalysisScoreDto,
  })
  financialMetrics: EnterpriseDividendAnalysisScoreDto;

  constructor(args: EnterpriseDividendAnalysisScoreBreakdownDto) {
    this.fcf = new EnterpriseDividendAnalysisFcfScoreDto(args.fcf);
    this.dividendCutHistory = new EnterpriseDividendAnalysisPeriodScoreDto(
      args.dividendCutHistory,
    );
    this.dividendGrowth = new EnterpriseDividendAnalysisPeriodScoreDto(
      args.dividendGrowth,
    );
    this.payoutRatio = new EnterpriseDividendAnalysisScoreDto(args.payoutRatio);
    this.dividendYield = new EnterpriseDividendAnalysisScoreDto(
      args.dividendYield,
    );
    this.financialMetrics = new EnterpriseDividendAnalysisScoreDto(
      args.financialMetrics,
    );
  }
}

export class EnterpriseDividendAnalysisDataSourceDto {
  @ApiProperty({
    description: "データソース名",
    example: "J-Quants API mock",
  })
  name: string;

  @ApiProperty({
    description: "データ基準日",
    example: "2026-06-26",
    format: "date",
  })
  asOfDate: string;

  constructor(args: EnterpriseDividendAnalysisDataSourceDto) {
    this.name = args.name;
    this.asOfDate = args.asOfDate;
  }
}

export class GetEnterpriseDividendAnalysisResponseDto {
  @ApiProperty({
    description: "銘柄コード",
    example: "8058",
  })
  symbolId: string;

  @ApiProperty({
    description: "企業名",
    example: "三菱商事",
  })
  companyName: string;

  @ApiProperty({
    description: "業種",
    example: "商社",
  })
  sector: string;

  @ApiProperty({
    description: "総合スコア",
    example: 92,
    minimum: 0,
  })
  totalScore: number;

  @ApiProperty({
    description: "配当持続性の判定",
    example: "安全寄り",
  })
  judgement: string;

  @ApiProperty({
    description: "配当持続性ラベル",
    enum: ["safe", "neutral", "watch"],
    example: "safe",
  })
  safetyLabel: EnterpriseDividendAnalysisSafetyLabel;

  @ApiProperty({
    description: "分析指標",
    type: EnterpriseDividendAnalysisMetricsDto,
  })
  metrics: EnterpriseDividendAnalysisMetricsDto;

  @ApiProperty({
    description: "スコア内訳",
    type: EnterpriseDividendAnalysisScoreBreakdownDto,
  })
  scoreBreakdown: EnterpriseDividendAnalysisScoreBreakdownDto;

  @ApiProperty({
    description: "分析サマリー。v1 では null",
    example: null,
    nullable: true,
    type: String,
  })
  analysisSummary: string | null;

  @ApiProperty({
    description: "金融業かどうか",
    example: false,
  })
  isFinancialBusiness: boolean;

  @ApiProperty({
    description: "FCF 評価対象外かどうか",
    example: false,
  })
  isFcfNotApplicable: boolean;

  @ApiProperty({
    description: "データソース",
    type: [EnterpriseDividendAnalysisDataSourceDto],
  })
  dataSources: EnterpriseDividendAnalysisDataSourceDto[];

  @ApiProperty({
    description: "データ更新日時",
    example: "2026-06-26T00:00:00.000Z",
    format: "date-time",
  })
  updatedAt: string;

  @ApiProperty({
    description: "データ基準日",
    example: "2026-06-26",
    format: "date",
  })
  dataAsOfDate: string;

  @ApiProperty({
    description: "スコアリングバージョン",
    example: "dividend-score-v1",
  })
  scoreVersion: string;

  @ApiProperty({
    description: "リアルタイムデータかどうか",
    example: false,
  })
  isRealtime: boolean;

  @ApiProperty({
    description: "利用上の注意",
    example: [
      "本画面は配当持続性を分析するためのものであり、特定銘柄の売買を推奨するものではありません。",
    ],
    isArray: true,
    type: String,
  })
  disclaimers: string[];

  constructor(args: GetEnterpriseDividendAnalysisResponseDto) {
    this.symbolId = args.symbolId;
    this.companyName = args.companyName;
    this.sector = args.sector;
    this.totalScore = args.totalScore;
    this.judgement = args.judgement;
    this.safetyLabel = args.safetyLabel;
    this.metrics = new EnterpriseDividendAnalysisMetricsDto(args.metrics);
    this.scoreBreakdown = new EnterpriseDividendAnalysisScoreBreakdownDto(
      args.scoreBreakdown,
    );
    this.analysisSummary = args.analysisSummary;
    this.isFinancialBusiness = args.isFinancialBusiness;
    this.isFcfNotApplicable = args.isFcfNotApplicable;
    this.dataSources = args.dataSources.map(
      (item) => new EnterpriseDividendAnalysisDataSourceDto(item),
    );
    this.updatedAt = args.updatedAt;
    this.dataAsOfDate = args.dataAsOfDate;
    this.scoreVersion = args.scoreVersion;
    this.isRealtime = args.isRealtime;
    this.disclaimers = args.disclaimers;
  }
}
