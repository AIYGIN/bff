import { Transform } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsUUID } from "class-validator";

export class GetPortfolioAnalysisQueryDto {
  @Transform(({ value }) => (typeof value === "string" ? value.split(",") : value))
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID("4", { each: true })
  holdingIds: string[];

  constructor(args?: GetPortfolioAnalysisQueryDto) {
    if (args) {
      this.holdingIds = args.holdingIds;
    }
  }
}
