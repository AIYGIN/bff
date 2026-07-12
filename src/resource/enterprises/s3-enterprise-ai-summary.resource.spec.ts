import {
  GetObjectCommand,
  NoSuchKey,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import {
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";

import { S3EnterpriseAiSummaryResource } from "./s3-enterprise-ai-summary.resource";

type SentCommandInput = {
  Bucket?: string;
  Key?: string;
};

type S3ClientMock = {
  send: jest.Mock;
};

const config = {
  s3Endpoint: "http://localhost:9000",
  s3Region: "us-east-1",
  s3AccessKey: "minio-access",
  s3SecretKey: "minio-secret",
  s3Bucket: "company-data",
  s3AiSummaryKeyPrefix: "",
};

const csv = [
  "companyName,companyCode,tweetSummary,commentSummary,investmentIssues,investmentHints,tweetSentimentScore,commentSentimentScore",
  "三菱UFJ FG,8306,配当方針への期待,株主還元への関心,金利変動に注意,配当と業績を確認,72,64",
].join("\n");

const createResource = (client: S3ClientMock, overrides = {}) =>
  new S3EnterpriseAiSummaryResource(
    { ...config, ...overrides } as never,
    client as never,
  );

describe("S3EnterpriseAiSummaryResource", () => {
  it("gets the configured S3 object and maps the CSV row to an internal entity", async () => {
    const client = {
      send: jest.fn().mockResolvedValue({ Body: Buffer.from(csv) }),
    };
    const resource = createResource(client);

    const entity = await resource.findOne("8306");
    const command = client.send.mock.calls[0]?.[0] as GetObjectCommand;

    expect(command.input as SentCommandInput).toMatchObject({
      Bucket: "company-data",
      Key: "8306-aisummary.csv",
    });
    expect(entity).toEqual({
      symbolId: "8306",
      companyName: "三菱UFJ FG",
      companyCode: "8306",
      tweetSummary: "配当方針への期待",
      commentSummary: "株主還元への関心",
      investmentIssues: "金利変動に注意",
      investmentHints: "配当と業績を確認",
      tweetSentimentScore: 72,
      commentSentimentScore: 64,
    });
  });

  it("uses the configured prefix without accepting bucket or key from the request", async () => {
    const client = {
      send: jest.fn().mockResolvedValue({ Body: Buffer.from(csv) }),
    };
    const resource = createResource(client, {
      s3AiSummaryKeyPrefix: "ai-summary/current/",
    });

    await resource.findOne("8306");

    const command = client.send.mock.calls[0]?.[0] as GetObjectCommand;
    expect(command.input as SentCommandInput).toMatchObject({
      Bucket: "company-data",
      Key: "ai-summary/current/8306-aisummary.csv",
    });
  });

  it("rounds blank, non-number, and out-of-range sentiment scores to null", async () => {
    const invalidScoreCsv = [
      "companyName,companyCode,tweetSummary,commentSummary,investmentIssues,investmentHints,tweetSentimentScore,commentSentimentScore",
      "三菱UFJ FG,8306,,,,,not-a-number,101",
    ].join("\n");
    const client = {
      send: jest.fn().mockResolvedValue({ Body: Buffer.from(invalidScoreCsv) }),
    };
    const resource = createResource(client);

    await expect(resource.findOne("8306")).resolves.toMatchObject({
      tweetSummary: null,
      commentSummary: null,
      investmentIssues: null,
      investmentHints: null,
      tweetSentimentScore: null,
      commentSentimentScore: null,
    });
  });

  it("maps NoSuchKey to not found without exposing S3 details", async () => {
    const client = {
      send: jest.fn().mockRejectedValue(
        new NoSuchKey({
          message: "missing",
          $metadata: {},
        }),
      ),
    };
    const resource = createResource(client);

    await expect(resource.findOne("9999")).rejects.toThrow(NotFoundException);
  });

  it("maps companyCode mismatch to not found", async () => {
    const client = {
      send: jest.fn().mockResolvedValue({ Body: Buffer.from(csv) }),
    };
    const resource = createResource(client);

    await expect(resource.findOne("9999")).rejects.toThrow(NotFoundException);
  });

  it("maps missing required CSV columns to an internal server error", async () => {
    const missingColumnCsv = [
      "companyName,companyCode,tweetSummary,commentSummary,investmentIssues,investmentHints,tweetSentimentScore",
      "三菱UFJ FG,8306,配当方針への期待,株主還元への関心,金利変動に注意,配当と業績を確認,72",
    ].join("\n");
    const client = {
      send: jest
        .fn()
        .mockResolvedValue({ Body: Buffer.from(missingColumnCsv) }),
    };
    const resource = createResource(client);

    await expect(resource.findOne("8306")).rejects.toThrow(
      InternalServerErrorException,
    );
  });

  it("maps MinIO or network errors to an internal server error", async () => {
    const client = {
      send: jest.fn().mockRejectedValue(
        new S3ServiceException({
          name: "ServiceUnavailable",
          message: "connect ECONNREFUSED",
          $fault: "server",
          $metadata: {},
        }),
      ),
    };
    const resource = createResource(client);

    await expect(resource.findOne("8306")).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});
