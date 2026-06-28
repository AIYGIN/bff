import { ApiProperty } from "@nestjs/swagger";

import { EnterpriseQuantInfoDto } from "./enterprise-quant-info.dto";

export class GetEnterpriseQuantsInfoResponseDto {
  @ApiProperty({
    description: "企業別クオンツ情報一覧",
    type: [EnterpriseQuantInfoDto],
  })
  enterprises: EnterpriseQuantInfoDto[];

  @ApiProperty({
    description: "レスポンス更新日時",
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

  constructor(args: GetEnterpriseQuantsInfoResponseDto) {
    this.enterprises = args.enterprises.map(
      (item) => new EnterpriseQuantInfoDto(item),
    );
    this.updatedAt = args.updatedAt;
    this.dataAsOfDate = args.dataAsOfDate;
    this.isRealtime = args.isRealtime;
    this.disclaimers = args.disclaimers;
  }
}
