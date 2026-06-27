import { ApiProperty } from "@nestjs/swagger";

import { EnterpriseQuantInfoDto } from "./enterprise-quant-info.dto";

export class GetEnterpriseQuantsInfoResponseDto {
  @ApiProperty({
    description: "企業別クオンツ情報ランキング",
    type: [EnterpriseQuantInfoDto],
  })
  ranking: EnterpriseQuantInfoDto[];

  @ApiProperty({
    description: "最終更新日",
    example: "2026-06-26",
  })
  lastUpdated: string;

  constructor(args: GetEnterpriseQuantsInfoResponseDto) {
    this.ranking = args.ranking.map((item) => new EnterpriseQuantInfoDto(item));
    this.lastUpdated = args.lastUpdated;
  }
}
