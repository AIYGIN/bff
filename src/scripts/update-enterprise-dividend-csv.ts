import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";
import { DividendAnalysisCsvBatchService } from "../service/enterprises/dividend-analysis-csv-batch.service";

const run = async (): Promise<void> => {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });
  try {
    const service = app.get(DividendAnalysisCsvBatchService);
    const result = await service.updateCsv();
    process.stdout.write(
      JSON.stringify(
        {
          status: "ok",
          candidateCount: result.candidateCount,
          outputPath: result.outputPath,
        },
        null,
        2,
      ),
    );
    process.stdout.write("\n");
  } finally {
    await app.close();
  }
};

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "update-csv failed";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
