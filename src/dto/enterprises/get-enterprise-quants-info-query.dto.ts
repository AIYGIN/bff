import { Transform } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export const ENTERPRISE_QUANTS_INFO_SORT_FIELDS = [
  "dividendScore",
  "rank",
  "dividendYield",
  "payoutRatio",
  "per",
  "pbr",
  "roe",
  "equityRatio",
] as const;

export type EnterpriseQuantsInfoSort =
  (typeof ENTERPRISE_QUANTS_INFO_SORT_FIELDS)[number];

export type EnterpriseQuantsInfoOrder = "asc" | "desc";

export class GetEnterpriseQuantsInfoQueryDto {
  @ApiPropertyOptional({
    description: "高配当候補上位 N 件",
    default: 50,
    minimum: 1,
    maximum: 50,
    example: 50,
  })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @ApiPropertyOptional({
    description: "並び替え項目",
    enum: ENTERPRISE_QUANTS_INFO_SORT_FIELDS,
    default: "dividendScore",
    example: "dividendScore",
  })
  @IsOptional()
  @IsIn(ENTERPRISE_QUANTS_INFO_SORT_FIELDS)
  sort?: EnterpriseQuantsInfoSort;

  @ApiPropertyOptional({
    description: "並び順",
    enum: ["asc", "desc"],
    default: "desc",
    example: "desc",
  })
  @IsOptional()
  @IsIn(["asc", "desc"])
  order?: EnterpriseQuantsInfoOrder;

  @ApiPropertyOptional({
    description: "スコアリングバージョン。未指定時は最新。",
    example: "v1",
  })
  @IsOptional()
  @IsString()
  scoreVersion?: string;
}

export class GetEnterpriseDividendAnalysisQueryDto {
  @ApiPropertyOptional({
    description: "スコアリングバージョン。未指定時は最新。",
    example: "v1",
  })
  @IsOptional()
  @IsString()
  scoreVersion?: string;
}
