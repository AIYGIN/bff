import { ApiProperty } from "@nestjs/swagger";

class EnterpriseScoreDto {
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

  constructor(args: EnterpriseScoreDto) {
    this.score = args.score;
    this.maxScore = args.maxScore;
  }
}

class EnterpriseFcfScoreDto extends EnterpriseScoreDto {
  @ApiProperty({
    description: "FCF 評価対象外かどうか",
    example: false,
  })
  isNotApplicable: boolean;

  constructor(args: EnterpriseFcfScoreDto) {
    super(args);
    this.isNotApplicable = args.isNotApplicable;
  }
}

class EnterprisePeriodScoreDto extends EnterpriseScoreDto {
  @ApiProperty({
    description: "評価対象期間（年）",
    example: 10,
    minimum: 0,
  })
  periodYears: number;

  constructor(args: EnterprisePeriodScoreDto) {
    super(args);
    this.periodYears = args.periodYears;
  }
}

export class EnterpriseScoreBreakdownDto {
  @ApiProperty({
    description: "フリーキャッシュフロー評価",
    type: EnterpriseFcfScoreDto,
  })
  fcf: EnterpriseFcfScoreDto;

  @ApiProperty({
    description: "減配履歴評価",
    type: EnterprisePeriodScoreDto,
  })
  dividendCutHistory: EnterprisePeriodScoreDto;

  @ApiProperty({
    description: "増配傾向評価",
    type: EnterprisePeriodScoreDto,
  })
  dividendGrowth: EnterprisePeriodScoreDto;

  @ApiProperty({
    description: "配当性向評価",
    type: EnterpriseScoreDto,
  })
  payoutRatio: EnterpriseScoreDto;

  @ApiProperty({
    description: "配当利回り評価",
    type: EnterpriseScoreDto,
  })
  dividendYield: EnterpriseScoreDto;

  @ApiProperty({
    description: "財務指標評価",
    type: EnterpriseScoreDto,
  })
  financialMetrics: EnterpriseScoreDto;

  constructor(args: EnterpriseScoreBreakdownDto) {
    this.fcf = new EnterpriseFcfScoreDto(args.fcf);
    this.dividendCutHistory = new EnterprisePeriodScoreDto(
      args.dividendCutHistory,
    );
    this.dividendGrowth = new EnterprisePeriodScoreDto(args.dividendGrowth);
    this.payoutRatio = new EnterpriseScoreDto(args.payoutRatio);
    this.dividendYield = new EnterpriseScoreDto(args.dividendYield);
    this.financialMetrics = new EnterpriseScoreDto(args.financialMetrics);
  }
}

export class EnterpriseQuantInfoDto {
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
    description: "スコア順位",
    example: 1,
    minimum: 1,
  })
  rank: number;

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
  safetyLabel: "safe" | "neutral" | "watch";

  @ApiProperty({
    description: "スコア内訳",
    type: EnterpriseScoreBreakdownDto,
  })
  scoreBreakdown: EnterpriseScoreBreakdownDto;

  @ApiProperty({
    description: "直近配当利回り",
    example: 3.7,
    minimum: 0,
  })
  latestDividendYield: number;

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

  constructor(args: EnterpriseQuantInfoDto) {
    this.symbolId = args.symbolId;
    this.companyName = args.companyName;
    this.sector = args.sector;
    this.rank = args.rank;
    this.totalScore = args.totalScore;
    this.judgement = args.judgement;
    this.safetyLabel = args.safetyLabel;
    this.scoreBreakdown = new EnterpriseScoreBreakdownDto(args.scoreBreakdown);
    this.latestDividendYield = args.latestDividendYield;
    this.isFinancialBusiness = args.isFinancialBusiness;
    this.isFcfNotApplicable = args.isFcfNotApplicable;
    this.updatedAt = args.updatedAt;
    this.dataAsOfDate = args.dataAsOfDate;
  }
}
