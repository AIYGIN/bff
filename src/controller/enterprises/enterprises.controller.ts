import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";

import {
  GetEnterpriseDividendAnalysisDocs,
  GetEnterpriseQuantsInfoDocs,
} from "../../docs/enterprises.docs";
import { GetEnterpriseDividendAnalysisResponseDto } from "../../dto/enterprises/get-enterprise-dividend-analysis-response.dto";
import {
  GetEnterpriseDividendAnalysisQueryDto,
  GetEnterpriseQuantsInfoQueryDto,
} from "../../dto/enterprises/get-enterprise-quants-info-query.dto";
import { GetEnterpriseQuantsInfoResponseDto } from "../../dto/enterprises/get-enterprise-quants-info-response.dto";
import { JwtAuthGuard } from "../../guard/jwt-auth.guard";
import { EnterprisesService } from "../../service/enterprises/enterprises.service";

@Controller("enterprises")
@UseGuards(JwtAuthGuard)
export class EnterprisesController {
  constructor(private readonly enterprisesService: EnterprisesService) {}

  @Get("quantsInfo")
  @GetEnterpriseQuantsInfoDocs()
  getQuantsInfo(
    @Query() query: GetEnterpriseQuantsInfoQueryDto,
  ): GetEnterpriseQuantsInfoResponseDto {
    return this.enterprisesService.getQuantsInfo(query);
  }

  @Get(":symbolId/dividendAnalysis")
  @GetEnterpriseDividendAnalysisDocs()
  getDividendAnalysis(
    @Param("symbolId") symbolId: string,
    @Query() query: GetEnterpriseDividendAnalysisQueryDto,
  ): GetEnterpriseDividendAnalysisResponseDto {
    if (!/^\d{4}$/.test(symbolId)) {
      throw new BadRequestException(
        "symbolId must be a 4-digit securities code",
      );
    }

    return this.enterprisesService.getDividendAnalysis(symbolId, query);
  }
}
