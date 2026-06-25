import { Controller, Get, UseGuards } from "@nestjs/common";

import { GetPortfolioHoldingsDocs } from "../../docs/portfolio.docs";
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
}
