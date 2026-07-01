import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppConfigService } from "../../common/config/app-config.service";
import { validateEnvironment } from "../../common/config/environment";
import { ExternalHttpModule } from "../../common/http/external-http.module";
import { EdinetEnterpriseFilingResource } from "../../resource/edinet/edinet-enterprise-filing.resource";
import { JQuantsEnterpriseDataResource } from "../../resource/jquants/j-quants-enterprise-data.resource";
import { DividendAnalysisCsvBatchService } from "./dividend-analysis-csv-batch.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    ExternalHttpModule,
  ],
  providers: [
    AppConfigService,
    DividendAnalysisCsvBatchService,
    EdinetEnterpriseFilingResource,
    JQuantsEnterpriseDataResource,
  ],
  exports: [DividendAnalysisCsvBatchService],
})
export class EnterprisesBatchModule {}