import { ApiProperty } from "@nestjs/swagger";

import {
  type EnterpriseQuantsInfoOrder,
  type EnterpriseQuantsInfoSort,
} from "./get-enterprise-quants-info-query.dto";
import { EnterpriseQuantInfoDto } from "./enterprise-quant-info.dto";

export class GetEnterpriseQuantsInfoResponseDto {
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
    description: "並び替え項目",
    enum: [
      "dividendScore",
      "rank",
      "dividendYield",
      "payoutRatio",
      "per",
      "pbr",
      "roe",
      "equityRatio",
    ],
    example: "dividendScore",
  })
  sort: EnterpriseQuantsInfoSort;

  @ApiProperty({
    description: "並び順",
    enum: ["asc", "desc"],
    example: "desc",
  })
  order: EnterpriseQuantsInfoOrder;

  @ApiProperty({
    description: "高配当候補一覧",
    type: [EnterpriseQuantInfoDto],
  })
  items: EnterpriseQuantInfoDto[];

  constructor(args: GetEnterpriseQuantsInfoResponseDto) {
    this.scoreVersion = args.scoreVersion;
    this.asOf = args.asOf;
    this.sort = args.sort;
    this.order = args.order;
    this.items = args.items.map((item) => new EnterpriseQuantInfoDto(item));
  }
}
