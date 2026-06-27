import { Controller, Get, UseGuards } from "@nestjs/common";

import { GetEnterpriseQuantsInfoDocs } from "../../docs/enterprises.docs";
import { GetEnterpriseQuantsInfoResponseDto } from "../../dto/enterprises/get-enterprise-quants-info-response.dto";
import { JwtAuthGuard } from "../../guard/jwt-auth.guard";
import { EnterprisesService } from "../../service/enterprises/enterprises.service";

@Controller("enterprises")
@UseGuards(JwtAuthGuard)
export class EnterprisesController {
  constructor(private readonly enterprisesService: EnterprisesService) {}

  @Get("quantsInfo")
  @GetEnterpriseQuantsInfoDocs()
  getQuantsInfo(): GetEnterpriseQuantsInfoResponseDto {
    return this.enterprisesService.getQuantsInfo();
  }
}
