import { ApiProperty } from "@nestjs/swagger";

export class EnterpriseQuantInfoDto {
  @ApiProperty({
    description: "企業名",
    example: "NTT",
  })
  name: string;

  @ApiProperty({
    description: "予測スコア",
    example: 30,
  })
  prediction: number;

  @ApiProperty({
    description: "買いシグナル",
    example: 30,
  })
  buy: number;

  @ApiProperty({
    description: "売りシグナル",
    example: 10,
  })
  sell: number;

  @ApiProperty({
    description: "上昇余地",
    example: 12,
  })
  upside: number;

  constructor(args: EnterpriseQuantInfoDto) {
    this.name = args.name;
    this.prediction = args.prediction;
    this.buy = args.buy;
    this.sell = args.sell;
    this.upside = args.upside;
  }
}
