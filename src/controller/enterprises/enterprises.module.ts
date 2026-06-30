import { Module } from "@nestjs/common";

import { ExternalHttpModule } from "../../common/http/external-http.module";
import { EdinetEnterpriseFilingResource } from "../../resource/enterprises/edinet-enterprise-filing.resource";
import { HighDividendCandidateResource } from "../../resource/enterprises/high-dividend-candidate.resource";
import { JQuantsEnterpriseDataResource } from "../../resource/enterprises/j-quants-enterprise-data.resource";
import { AuthModule } from "../auth/auth.module";
import { UnifiedCsvEnterpriseDividendAnalysisResource } from "../../resource/enterprises/unified-csv-enterprise-dividend-analysis.resource";
import { DividendAnalysisCsvBatchService } from "../../service/enterprises/dividend-analysis-csv-batch.service";
import { EnterprisesService } from "../../service/enterprises/enterprises.service";
import { EnterprisesController } from "./enterprises.controller";

@Module({
  imports: [AuthModule, ExternalHttpModule],
  controllers: [EnterprisesController],
  providers: [
    EnterprisesService,
    DividendAnalysisCsvBatchService,
    EdinetEnterpriseFilingResource,
    HighDividendCandidateResource,
    JQuantsEnterpriseDataResource,
    UnifiedCsvEnterpriseDividendAnalysisResource,
  ],
  exports: [DividendAnalysisCsvBatchService],
})
export class EnterprisesModule {}
