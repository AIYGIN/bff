import {
  GetObjectCommand,
  type GetObjectCommandOutput,
  NoSuchKey,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import {
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Optional,
} from "@nestjs/common";

import { AppConfigService } from "../../common/config/app-config.service";
import { type EnterpriseAiSummaryEntity } from "../../entity/enterprises/enterprise-ai-summary.entity";

export const ENTERPRISE_AI_SUMMARY_S3_CLIENT = Symbol(
  "ENTERPRISE_AI_SUMMARY_S3_CLIENT",
);

interface S3ClientLike {
  send(command: GetObjectCommand): Promise<GetObjectCommandOutput>;
}

interface AiSummaryCsvRow {
  companyName: string;
  companyCode: string;
  tweetSummary: string;
  commentSummary: string;
  investmentIssues: string;
  investmentHints: string;
  tweetSentimentScore: string;
  commentSentimentScore: string;
}

const REQUIRED_COLUMNS: Array<keyof AiSummaryCsvRow> = [
  "companyName",
  "companyCode",
  "tweetSummary",
  "commentSummary",
  "investmentIssues",
  "investmentHints",
  "tweetSentimentScore",
  "commentSentimentScore",
];

@Injectable()
export class S3EnterpriseAiSummaryResource {
  private s3Client: S3ClientLike | null = null;

  constructor(
    private readonly appConfigService: AppConfigService,
    @Optional()
    @Inject(ENTERPRISE_AI_SUMMARY_S3_CLIENT)
    private readonly s3ClientOverride?: S3ClientLike,
  ) {}

  async findOne(symbolId: string): Promise<EnterpriseAiSummaryEntity> {
    try {
      const output = await this.client().send(
        new GetObjectCommand({
          Bucket: this.appConfigService.s3Bucket,
          Key: this.buildObjectKey(symbolId),
        }),
      );
      const csvContent = await bodyToString(output.Body);
      return parseAiSummaryCsv(csvContent, symbolId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (isNoSuchKey(error)) {
        throw new NotFoundException("AI summary not found");
      }
      throw new InternalServerErrorException({
        code: "ENTERPRISE_AI_SUMMARY_UNAVAILABLE",
      });
    }
  }

  private client(): S3ClientLike {
    if (this.s3ClientOverride !== undefined) {
      return this.s3ClientOverride;
    }
    if (this.s3Client !== null) {
      return this.s3Client;
    }

    const accessKeyId = this.appConfigService.s3AccessKey;
    const secretAccessKey = this.appConfigService.s3SecretKey;
    if (accessKeyId === null || secretAccessKey === null) {
      throw new InternalServerErrorException({
        code: "ENTERPRISE_AI_SUMMARY_S3_CONFIGURATION_UNAVAILABLE",
      });
    }

    this.s3Client = new S3Client({
      endpoint: this.appConfigService.s3Endpoint,
      region: this.appConfigService.s3Region,
      forcePathStyle: true,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    return this.s3Client;
  }

  private buildObjectKey(symbolId: string): string {
    const fileName = `${symbolId}-aisummary.csv`;
    const prefix = this.appConfigService.s3AiSummaryKeyPrefix
      .trim()
      .replace(/^\/+|\/+$/g, "");
    return prefix === "" ? fileName : `${prefix}/${fileName}`;
  }
}

const parseAiSummaryCsv = (
  csvContent: string,
  symbolId: string,
): EnterpriseAiSummaryEntity => {
  const [headerLine, ...dataLines] = csvContent.trim().split(/\r?\n/);
  if (headerLine === undefined || headerLine.trim() === "") {
    throw new InternalServerErrorException({
      code: "ENTERPRISE_AI_SUMMARY_CSV_EMPTY",
    });
  }

  const headers = parseCsvLine(headerLine) as Array<keyof AiSummaryCsvRow>;
  for (const column of REQUIRED_COLUMNS) {
    if (!headers.includes(column)) {
      throw new InternalServerErrorException({
        code: "ENTERPRISE_AI_SUMMARY_CSV_REQUIRED_COLUMN_MISSING",
        column,
      });
    }
  }

  const dataLine = dataLines.find((line) => line.trim() !== "");
  if (dataLine === undefined) {
    throw new InternalServerErrorException({
      code: "ENTERPRISE_AI_SUMMARY_CSV_EMPTY",
    });
  }

  const values = parseCsvLine(dataLine);
  const row = Object.fromEntries(
    headers.map((header, index) => [header, values[index] ?? ""]),
  ) as unknown as AiSummaryCsvRow;

  if (row.companyCode.trim() !== symbolId) {
    throw new NotFoundException("AI summary not found");
  }
  if (row.companyName.trim() === "") {
    throw new InternalServerErrorException({
      code: "ENTERPRISE_AI_SUMMARY_CSV_REQUIRED_VALUE_MISSING",
      column: "companyName",
    });
  }

  return {
    symbolId,
    companyName: row.companyName,
    companyCode: row.companyCode,
    tweetSummary: nullableString(row.tweetSummary),
    commentSummary: nullableString(row.commentSummary),
    investmentIssues: nullableString(row.investmentIssues),
    investmentHints: nullableString(row.investmentHints),
    tweetSentimentScore: parseSentimentScore(row.tweetSentimentScore),
    commentSentimentScore: parseSentimentScore(row.commentSentimentScore),
  };
};

const bodyToString = async (
  body: GetObjectCommandOutput["Body"],
): Promise<string> => {
  const bodyValue: unknown = body;
  if (bodyValue === undefined) {
    throw new InternalServerErrorException({
      code: "ENTERPRISE_AI_SUMMARY_S3_BODY_EMPTY",
    });
  }
  if (typeof bodyValue === "string") {
    return bodyValue;
  }
  if (bodyValue instanceof Uint8Array) {
    return Buffer.from(bodyValue).toString("utf8");
  }
  if (hasTransformToString(bodyValue)) {
    return bodyValue.transformToString();
  }
  if (isAsyncIterable(bodyValue)) {
    const chunks: Buffer[] = [];
    for await (const chunk of bodyValue) {
      chunks.push(chunkToBuffer(chunk));
    }
    return Buffer.concat(chunks).toString("utf8");
  }

  throw new InternalServerErrorException({
    code: "ENTERPRISE_AI_SUMMARY_S3_BODY_UNSUPPORTED",
  });
};

const hasTransformToString = (
  body: unknown,
): body is { transformToString: () => Promise<string> } =>
  typeof body === "object" &&
  body !== null &&
  "transformToString" in body &&
  typeof body.transformToString === "function";

const isAsyncIterable = (body: unknown): body is AsyncIterable<unknown> =>
  typeof body === "object" &&
  body !== null &&
  Symbol.asyncIterator in body &&
  typeof body[Symbol.asyncIterator] === "function";

const chunkToBuffer = (chunk: unknown): Buffer => {
  if (Buffer.isBuffer(chunk)) {
    return chunk;
  }
  if (chunk instanceof Uint8Array) {
    return Buffer.from(chunk);
  }
  return Buffer.from(String(chunk));
};

const isNoSuchKey = (error: unknown): boolean =>
  error instanceof NoSuchKey ||
  (error instanceof S3ServiceException && error.name === "NoSuchKey") ||
  (typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "NoSuchKey");

const parseCsvLine = (line: string): string[] => {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"' && inQuotes && nextCharacter === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (character === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (character === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += character;
  }

  values.push(current);
  return values;
};

const nullableString = (value: string): string | null =>
  value.trim() === "" ? null : value;

const parseSentimentScore = (value: string): number | null => {
  if (value.trim() === "") {
    return null;
  }

  const score = Number(value);
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    return null;
  }
  return score;
};
