import { ApiProperty } from "@nestjs/swagger";

import { PortfolioHoldingDto } from "./portfolio-holding.dto";

export class GetPortfolioHoldingsResponseDto {
  @ApiProperty({
    description: "ポートフォリオ保有商品",
    isArray: true,
    type: PortfolioHoldingDto,
  })
  holdings: PortfolioHoldingDto[];

  @ApiProperty({
    description: "mock holdings の最終更新日時",
    example: "2026-06-22T00:00:00.000Z",
  })
  lastUpdated: string;

  constructor(args: GetPortfolioHoldingsResponseDto) {
    this.holdings = args.holdings.map(
      (holding) => new PortfolioHoldingDto(holding),
    );
    this.lastUpdated = args.lastUpdated;
  }
}
