import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { PortfolioService } from "../../service/portfolio/portfolio.service";
import { PortfolioController } from "./portfolio.controller";

@Module({
  imports: [AuthModule],
  controllers: [PortfolioController],
  providers: [PortfolioService],
})
export class PortfolioModule {}
