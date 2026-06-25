import { ApiProperty } from "@nestjs/swagger";

export class PortfolioHoldingDto {
  @ApiProperty({
    description: "将来の ID 導入を見据えた holdings の識別子",
    example: "550e8400-e29b-41d4-a716-446655440001",
    format: "uuid",
  })
  holdingId: string;

  @ApiProperty({
    description: "表示用の商品名",
    example: "eMAXIS Slim 全世界株式（オール・カントリー）",
  })
  productName: string;

  @ApiProperty({
    description: "保有割合。0-100 percent",
    example: 60,
    maximum: 100,
    minimum: 0,
  })
  ratio: number;

  constructor(args: PortfolioHoldingDto) {
    this.holdingId = args.holdingId;
    this.productName = args.productName;
    this.ratio = args.ratio;
  }
}
