import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { JQuantsEnterpriseQuantsInfoMockResource } from "../../resource/enterprises/j-quants-enterprise-quants-info-mock.resource";
import { EnterprisesService } from "../../service/enterprises/enterprises.service";
import { EnterprisesController } from "./enterprises.controller";

@Module({
  imports: [AuthModule],
  controllers: [EnterprisesController],
  providers: [EnterprisesService, JQuantsEnterpriseQuantsInfoMockResource],
})
export class EnterprisesModule {}
