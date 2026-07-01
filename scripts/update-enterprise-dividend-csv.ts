import { NestFactory } from "@nestjs/core";
import { isAxiosError } from "axios";
import { EnterprisesBatchModule } from "../src/batch/enterprises/enterprises-batch.module";
import { DividendAnalysisCsvBatchService } from "../src/batch/enterprises/dividend-analysis-csv-batch.service";

const run = async (): Promise<void> => {
  const app = await NestFactory.createApplicationContext(
    EnterprisesBatchModule,
    {
      logger: false,
    },
  );
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
  const detail = errorDetail(error);
  if (detail !== null) {
    process.stderr.write(`${detail}\n`);
  }
  process.exitCode = 1;
});

const errorDetail = (error: unknown): string | null => {
  if (!(error instanceof Error) || !("cause" in error)) {
    return null;
  }
  const cause = error.cause;
  if (!isAxiosError(cause)) {
    return null;
  }
  const responseMessage = responseMessageValue(cause.response?.data);
  return [
    "cause:",
    cause.response?.status ?? cause.code ?? "unknown",
    responseMessage ?? cause.message,
  ].join(" ");
};

const responseMessageValue = (value: unknown): string | null => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const message = (value as Record<string, unknown>).message;
  return typeof message === "string" ? message : null;
};
