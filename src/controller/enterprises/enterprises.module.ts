import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { S3EnterpriseAiSummaryResource } from "../../resource/enterprises/s3-enterprise-ai-summary.resource";
import { UnifiedCsvEnterpriseDividendAnalysisResource } from "../../resource/enterprises/unified-csv-enterprise-dividend-analysis.resource";
import { EnterprisesService } from "../../service/enterprises/enterprises.service";
import { EnterprisesController } from "./enterprises.controller";

@Module({
  imports: [AuthModule],
  controllers: [EnterprisesController],
  providers: [
    EnterprisesService,
    UnifiedCsvEnterpriseDividendAnalysisResource,
    S3EnterpriseAiSummaryResource,
  ],
})
export class EnterprisesModule {}
