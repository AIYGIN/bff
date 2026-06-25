import { ApiProperty } from "@nestjs/swagger";

class PortfolioAnalysisRatioDto {
  @ApiProperty({
    description: "表示名",
    example: "Information Technology",
  })
  name: string;

  @ApiProperty({
    description: "比率。0 から 100 の数値です。",
    example: 24.5,
    maximum: 100,
    minimum: 0,
  })
  ratio: number;

  constructor(args: PortfolioAnalysisRatioDto) {
    this.name = args.name;
    this.ratio = args.ratio;
  }
}

export class GetPortfolioAnalysisResponseDto {
  @ApiProperty({
    description: "セクター別配分。比率が高い順です。",
    type: [PortfolioAnalysisRatioDto],
  })
  sectorAllocations: PortfolioAnalysisRatioDto[];

  @ApiProperty({
    description: "主要構成銘柄。比率が高い順です。",
    type: [PortfolioAnalysisRatioDto],
  })
  constituents: PortfolioAnalysisRatioDto[];

  @ApiProperty({
    description: "国別配分。比率が高い順です。",
    type: [PortfolioAnalysisRatioDto],
  })
  countryAllocations: PortfolioAnalysisRatioDto[];

  @ApiProperty({
    description: "分析結果の最終更新日時",
    example: "2026-06-22T00:00:00.000Z",
  })
  lastUpdated: string;

  constructor(args: {
    sectorAllocations: PortfolioAnalysisRatioDto[];
    constituents: PortfolioAnalysisRatioDto[];
    countryAllocations: PortfolioAnalysisRatioDto[];
    lastUpdated: string;
  }) {
    this.sectorAllocations = args.sectorAllocations.map(
      (allocation) => new PortfolioAnalysisRatioDto(allocation),
    );
    this.constituents = args.constituents.map(
      (constituent) => new PortfolioAnalysisRatioDto(constituent),
    );
    this.countryAllocations = args.countryAllocations.map(
      (allocation) => new PortfolioAnalysisRatioDto(allocation),
    );
    this.lastUpdated = args.lastUpdated;
  }
}
