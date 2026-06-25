import { Controller, Get, Query, UseGuards } from "@nestjs/common";

import {
  GetPortfolioAnalysisDocs,
  GetPortfolioHoldingsDocs,
} from "../../docs/portfolio.docs";
import { GetPortfolioAnalysisQueryDto } from "../../dto/portfolio/get-portfolio-analysis-query.dto";
import { GetPortfolioAnalysisResponseDto } from "../../dto/portfolio/get-portfolio-analysis-response.dto";
import { GetPortfolioHoldingsResponseDto } from "../../dto/portfolio/get-portfolio-holdings-response.dto";
import { JwtAuthGuard } from "../../guard/jwt-auth.guard";
import { PortfolioService } from "../../service/portfolio/portfolio.service";

@Controller("portfolio")
@UseGuards(JwtAuthGuard)
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get("holdings")
  @GetPortfolioHoldingsDocs()
  async getHoldings(): Promise<GetPortfolioHoldingsResponseDto> {
    return this.portfolioService.getHoldings();
  }

  @Get("analysis")
  @GetPortfolioAnalysisDocs()
  async getAnalysis(
    @Query() query: GetPortfolioAnalysisQueryDto,
  ): Promise<GetPortfolioAnalysisResponseDto> {
    return this.portfolioService.getAnalysis({ holdingIds: query.holdingIds });
  }
}
