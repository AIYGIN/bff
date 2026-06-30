import { Module } from "@nestjs/common";
import { ExternalHttpModule } from "../../common/http/external-http.module";
import { EdinetEnterpriseFilingResource } from "../../resource/edinet/edinet-enterprise-filing.resource";
import { JQuantsEnterpriseDataResource } from "../../resource/jquants/j-quants-enterprise-data.resource";
import { DividendAnalysisCsvBatchService } from "./dividend-analysis-csv-batch.service";

@Module({
  imports: [ExternalHttpModule],
  providers: [
    DividendAnalysisCsvBatchService,
    EdinetEnterpriseFilingResource,
    JQuantsEnterpriseDataResource,
  ],
  exports: [DividendAnalysisCsvBatchService],
})
export class EnterprisesBatchModule {}
