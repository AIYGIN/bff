import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { type OpenAPIObject } from "@nestjs/swagger";
import request from "supertest";

import { configureApp } from "../src/bootstrap";
import { AppConfigService } from "../src/common/config/app-config.service";
import { LoggingModule } from "../src/common/logging/logging.module";
import { AuthService } from "../src/service/auth/auth.service";
import { AppModule } from "./../src/app.module";

const quantsInfoResponseKeys = [
  "scoreVersion",
  "asOf",
  "sort",
  "order",
  "items",
];

const quantsInfoItemKeys = [
  "rank",
  "symbolId",
  "companyName",
  "market",
  "sector",
  "dividendScore",
  "dividendYield",
  "payoutRatio",
  "per",
  "pbr",
  "roe",
  "equityRatio",
  "freeCashFlowStatus",
  "missingFields",
  "warnings",
];

const dividendAnalysisResponseKeys = [
  "symbolId",
  "companyName",
  "scoreVersion",
  "asOf",
  "rank",
  "dividendScore",
  "metrics",
  "analysis",
  "missingFields",
  "warnings",
];

const forbiddenPublicTerms = [
  "API キー",
  "api key",
  "apiKey",
  "jquantsApiKey",
  "edinetApiKey",
  "private CSV path",
  "privateCsvPath",
  "privateRawPath",
  "raw path",
  "rawPath",
  "raw payload",
  "rawPayload",
];

describe("EnterprisesController (e2e)", () => {
  let app: INestApplication;
  let document: OpenAPIObject;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AuthService)
      .useValue({
        verifyAccessToken: jest.fn().mockReturnValue({
          id: "33333333-3333-3333-3333-333333333333",
        }),
      })
      .overrideProvider(AppConfigService)
      .useValue({
        logLevel: "silent",
        enterpriseDividendAnalysisCsvPath:
          "test/fixtures/enterprises/unified-dividend-analysis.csv",
      })
      .overrideProvider(LoggingModule)
      .useValue({})
      .compile();

    app = moduleFixture.createNestApplication();
    document = configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  it("GET /enterprises/quantsInfo returns normalized CSV-backed quants info for query options", async () => {
    const response = await request(app.getHttpServer())
      .get("/enterprises/quantsInfo")
      .query({
        limit: 1,
        sort: "dividendScore",
        order: "desc",
        scoreVersion: "dividend-score-v1",
      })
      .set("Cookie", "access_token=fake-token")
      .expect(200);

    expect(Object.keys(response.body)).toEqual(quantsInfoResponseKeys);
    expect(response.body).toMatchObject({
      scoreVersion: "dividend-score-v1",
      sort: "dividendScore",
      order: "desc",
    });
    expect(response.body.asOf).toEqual(expect.any(String));
    expect(response.body.items).toHaveLength(1);
    expect(Object.keys(response.body.items[0])).toEqual(quantsInfoItemKeys);
    expect(response.body.items[0]).toMatchObject({
      rank: expect.any(Number),
      symbolId: expect.any(String),
      companyName: expect.any(String),
      market: expect.any(String),
      sector: expect.any(String),
      dividendScore: expect.any(Number),
      dividendYield: expect.any(Number),
      freeCashFlowStatus: expect.any(String),
      missingFields: expect.any(Array),
      warnings: expect.any(Array),
    });
    expect(response.body.items[0].rank).toBeGreaterThanOrEqual(1);
    expect(response.body.items[0].dividendScore).toBeGreaterThanOrEqual(0);
    expect(response.body.items[0].dividendScore).toBeLessThanOrEqual(100);

    const serializedBody = JSON.stringify(response.body);
    for (const forbiddenTerm of forbiddenPublicTerms) {
      expect(serializedBody).not.toContain(forbiddenTerm);
    }
  });

  it("GET /enterprises/quantsInfo requires access token", async () => {
    await request(app.getHttpServer())
      .get("/enterprises/quantsInfo")
      .expect(401);
  });

  it("GET /enterprises/{symbolId}/dividendAnalysis returns normalized detail for scoreVersion", async () => {
    const response = await request(app.getHttpServer())
      .get("/enterprises/8306/dividendAnalysis")
      .query({ scoreVersion: "dividend-score-v1" })
      .set("Cookie", "access_token=fake-token")
      .expect(200);

    expect(Object.keys(response.body)).toEqual(dividendAnalysisResponseKeys);
    expect(response.body).toMatchObject({
      symbolId: "8306",
      companyName: expect.any(String),
      scoreVersion: "dividend-score-v1",
      asOf: expect.any(String),
      rank: expect.any(Number),
      dividendScore: expect.any(Number),
      metrics: expect.any(Object),
      analysis: expect.any(Object),
      missingFields: expect.any(Array),
      warnings: expect.any(Array),
    });
    expect(response.body.rank).toBeGreaterThanOrEqual(1);
    expect(response.body.dividendScore).toBeGreaterThanOrEqual(0);
    expect(response.body.dividendScore).toBeLessThanOrEqual(100);
  });

  it("GET /enterprises/{symbolId}/dividendAnalysis returns NOT_APPLICABLE FCF for financial businesses without error", async () => {
    const response = await request(app.getHttpServer())
      .get("/enterprises/8306/dividendAnalysis")
      .query({ scoreVersion: "dividend-score-v1" })
      .set("Cookie", "access_token=fake-token")
      .expect(200);

    expect(response.body.metrics).toMatchObject({
      freeCashFlowStatus: "NOT_APPLICABLE",
    });
    expect(response.body.analysis).toEqual(expect.any(Object));
    expect(response.body.missingFields).toContain("freeCashFlow");
    expect(response.body.warnings).toEqual(expect.any(Array));
  });

  it("GET /enterprises/{symbolId}/dividendAnalysis rejects invalid symbolId", async () => {
    await request(app.getHttpServer())
      .get("/enterprises/abc/dividendAnalysis")
      .set("Cookie", "access_token=fake-token")
      .expect(400);
  });

  it("GET /enterprises/{symbolId}/dividendAnalysis returns not found for unsupported symbolId", async () => {
    await request(app.getHttpServer())
      .get("/enterprises/9999/dividendAnalysis")
      .set("Cookie", "access_token=fake-token")
      .expect(404);
  });

  it("GET /enterprises/{symbolId}/dividendAnalysis requires access token", async () => {
    await request(app.getHttpServer())
      .get("/enterprises/8306/dividendAnalysis")
      .expect(401);
  });

  it("exposes quants info OpenAPI contract without Entity or secret/raw fields", () => {
    const operation = document.paths["/enterprises/quantsInfo"]?.get;

    expect(operation?.tags).toEqual(["enterprises"]);
    expect(operation?.summary).toBe("高配当候補上位一覧を取得する");
    expect(operation?.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "limit",
          in: "query",
          required: false,
        }),
        expect.objectContaining({ name: "sort", in: "query", required: false }),
        expect.objectContaining({
          name: "order",
          in: "query",
          required: false,
        }),
        expect.objectContaining({
          name: "scoreVersion",
          in: "query",
          required: false,
        }),
      ]),
    );
    expect(operation?.responses).toMatchObject({
      "200": {},
      "400": {},
      "401": {},
      "500": {},
    });
    expect(
      document.components?.schemas?.GetEnterpriseQuantsInfoResponseDto,
    ).toMatchObject({
      properties: {
        scoreVersion: { type: "string" },
        asOf: { type: "string", format: "date" },
        sort: { type: "string" },
        order: { type: "string" },
        items: {
          type: "array",
          items: { $ref: "#/components/schemas/EnterpriseQuantInfoDto" },
        },
      },
      required: quantsInfoResponseKeys,
    });
    expect(document.components?.schemas?.EnterpriseQuantInfoDto).toMatchObject({
      properties: {
        rank: { type: "number", minimum: 1 },
        symbolId: { type: "string" },
        companyName: { type: "string" },
        dividendScore: { type: "number", minimum: 0, maximum: 100 },
        dividendYield: { type: "number" },
        freeCashFlowStatus: { type: "string" },
        missingFields: { type: "array", items: { type: "string" } },
        warnings: { type: "array", items: { type: "string" } },
      },
    });

    const serializedDocument = JSON.stringify({
      operation,
      schemas: document.components?.schemas,
    });
    expect(Object.keys(document.components?.schemas ?? {})).not.toContain(
      "EnterpriseQuantInfoEntity",
    );
    for (const forbiddenTerm of forbiddenPublicTerms) {
      expect(serializedDocument).not.toContain(forbiddenTerm);
    }
  });

  it("exposes dividend analysis OpenAPI contract without Entity or secret/raw fields", () => {
    const operation =
      document.paths["/enterprises/{symbolId}/dividendAnalysis"]?.get;

    expect(operation?.tags).toEqual(["enterprises"]);
    expect(operation?.summary).toBe("指定銘柄の高配当分析を取得する");
    expect(operation?.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "symbolId",
          in: "path",
          required: true,
        }),
        expect.objectContaining({
          name: "scoreVersion",
          in: "query",
          required: false,
        }),
      ]),
    );
    expect(operation?.responses).toMatchObject({
      "200": {},
      "400": {},
      "401": {},
      "404": {},
      "500": {},
    });
    expect(
      document.components?.schemas?.GetEnterpriseDividendAnalysisResponseDto,
    ).toMatchObject({
      properties: {
        symbolId: { type: "string" },
        companyName: { type: "string" },
        scoreVersion: { type: "string" },
        asOf: { type: "string", format: "date" },
        rank: { type: "number", minimum: 1 },
        dividendScore: { type: "number", minimum: 0, maximum: 100 },
        metrics: expect.any(Object),
        analysis: expect.any(Object),
        missingFields: { type: "array", items: { type: "string" } },
        warnings: { type: "array", items: { type: "string" } },
      },
      required: dividendAnalysisResponseKeys,
    });

    const serializedDocument = JSON.stringify({
      operation,
      schemas: document.components?.schemas,
    });
    expect(Object.keys(document.components?.schemas ?? {})).not.toContain(
      "EnterpriseDividendAnalysisEntity",
    );
    for (const forbiddenTerm of forbiddenPublicTerms) {
      expect(serializedDocument).not.toContain(forbiddenTerm);
    }
  });
});
