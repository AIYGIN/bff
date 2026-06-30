import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import { type FreeCashFlowStatus } from "../../entity/enterprises/dividend-analysis.entity";

export class EnterpriseDividendAnalysisMetricsDto {
  @ApiProperty({
    description: "配当利回り",
    example: 4.85,
  })
  dividendYield: number;

  @ApiPropertyOptional({
    description: "配当性向",
    example: 72.1,
    nullable: true,
  })
  payoutRatio: number | null;

  @ApiPropertyOptional({
    description: "PER",
    example: 14.2,
    nullable: true,
  })
  per: number | null;

  @ApiPropertyOptional({
    description: "PBR",
    example: 1.55,
    nullable: true,
  })
  pbr: number | null;

  @ApiPropertyOptional({
    description: "ROE",
    example: 10.8,
    nullable: true,
  })
  roe: number | null;

  @ApiPropertyOptional({
    description: "自己資本比率",
    example: 52.3,
    nullable: true,
  })
  equityRatio: number | null;

  @ApiPropertyOptional({
    description: "フリーキャッシュフロー",
    example: 1234567890,
    nullable: true,
  })
  freeCashFlow: number | null;

  @ApiProperty({
    description: "フリーキャッシュフローの扱い",
    enum: ["AVAILABLE", "NOT_APPLICABLE", "MISSING"],
    example: "AVAILABLE",
  })
  freeCashFlowStatus: FreeCashFlowStatus;

  constructor(args: EnterpriseDividendAnalysisMetricsDto) {
    this.dividendYield = args.dividendYield;
    this.payoutRatio = args.payoutRatio;
    this.per = args.per;
    this.pbr = args.pbr;
    this.roe = args.roe;
    this.equityRatio = args.equityRatio;
    this.freeCashFlow = args.freeCashFlow;
    this.freeCashFlowStatus = args.freeCashFlowStatus;
  }
}

export class EnterpriseDividendAnalysisCommentaryDto {
  @ApiProperty({
    description: "分析サマリー",
    example: "高配当利回りと財務健全性を総合評価",
  })
  summary: string;

  @ApiProperty({
    description: "ポジティブ要因",
    example: ["配当利回りが高い"],
    isArray: true,
    type: String,
  })
  positiveFactors: string[];

  @ApiProperty({
    description: "リスク要因",
    example: ["配当性向が高め"],
    isArray: true,
    type: String,
  })
  riskFactors: string[];

  constructor(args: EnterpriseDividendAnalysisCommentaryDto) {
    this.summary = args.summary;
    this.positiveFactors = args.positiveFactors;
    this.riskFactors = args.riskFactors;
  }
}

export class GetEnterpriseDividendAnalysisResponseDto {
  @ApiProperty({
    description: "銘柄コード",
    example: "2914",
  })
  symbolId: string;

  @ApiProperty({
    description: "企業名",
    example: "日本たばこ産業",
  })
  companyName: string;

  @ApiProperty({
    description: "スコアリングバージョン",
    example: "v1",
  })
  scoreVersion: string;

  @ApiProperty({
    description: "データ基準日",
    example: "2026-06-30",
    format: "date",
  })
  asOf: string;

  @ApiProperty({
    description: "上位候補順位",
    example: 1,
    minimum: 1,
  })
  rank: number;

  @ApiProperty({
    description: "配当スコア",
    example: 92.4,
    minimum: 0,
    maximum: 100,
  })
  dividendScore: number;

  @ApiProperty({
    description: "分析指標",
    type: EnterpriseDividendAnalysisMetricsDto,
  })
  metrics: EnterpriseDividendAnalysisMetricsDto;

  @ApiProperty({
    description: "分析コメント",
    type: EnterpriseDividendAnalysisCommentaryDto,
  })
  analysis: EnterpriseDividendAnalysisCommentaryDto;

  @ApiProperty({
    description: "欠損フィールド",
    example: [],
    isArray: true,
    type: String,
  })
  missingFields: string[];

  @ApiProperty({
    description: "警告コード",
    example: [],
    isArray: true,
    type: String,
  })
  warnings: string[];

  constructor(args: GetEnterpriseDividendAnalysisResponseDto) {
    this.symbolId = args.symbolId;
    this.companyName = args.companyName;
    this.scoreVersion = args.scoreVersion;
    this.asOf = args.asOf;
    this.rank = args.rank;
    this.dividendScore = args.dividendScore;
    this.metrics = new EnterpriseDividendAnalysisMetricsDto(args.metrics);
    this.analysis = new EnterpriseDividendAnalysisCommentaryDto(args.analysis);
    this.missingFields = args.missingFields;
    this.warnings = args.warnings;
  }
}
