import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import { type FreeCashFlowStatus } from "../../entity/enterprises/dividend-analysis.entity";

export class EnterpriseQuantInfoDto {
  @ApiProperty({
    description: "上位候補順位",
    example: 1,
    minimum: 1,
  })
  rank: number;

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

  @ApiPropertyOptional({
    description: "市場区分",
    example: "Prime",
    nullable: true,
  })
  market: string | null;

  @ApiPropertyOptional({
    description: "業種",
    example: "食料品",
    nullable: true,
  })
  sector: string | null;

  @ApiProperty({
    description: "配当スコア",
    example: 92.4,
    minimum: 0,
    maximum: 100,
  })
  dividendScore: number;

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

  @ApiProperty({
    description: "フリーキャッシュフローの扱い",
    enum: ["AVAILABLE", "NOT_APPLICABLE", "MISSING"],
    example: "AVAILABLE",
  })
  freeCashFlowStatus: FreeCashFlowStatus;

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

  constructor(args: EnterpriseQuantInfoDto) {
    this.rank = args.rank;
    this.symbolId = args.symbolId;
    this.companyName = args.companyName;
    this.market = args.market;
    this.sector = args.sector;
    this.dividendScore = args.dividendScore;
    this.dividendYield = args.dividendYield;
    this.payoutRatio = args.payoutRatio;
    this.per = args.per;
    this.pbr = args.pbr;
    this.roe = args.roe;
    this.equityRatio = args.equityRatio;
    this.freeCashFlowStatus = args.freeCashFlowStatus;
    this.missingFields = args.missingFields;
    this.warnings = args.warnings;
  }
}
