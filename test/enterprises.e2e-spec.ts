import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { type OpenAPIObject } from "@nestjs/swagger";
import request from "supertest";

import { configureApp } from "../src/bootstrap";
import { LoggingModule } from "../src/common/logging/logging.module";
import { AuthService } from "../src/service/auth/auth.service";
import { AppModule } from "./../src/app.module";

const dividendAnalysisResponseKeys = [
  "symbolId",
  "companyName",
  "sector",
  "totalScore",
  "judgement",
  "safetyLabel",
  "metrics",
  "scoreBreakdown",
  "analysisSummary",
  "isFinancialBusiness",
  "isFcfNotApplicable",
  "dataSources",
  "updatedAt",
  "dataAsOfDate",
  "scoreVersion",
  "isRealtime",
  "disclaimers",
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
      .overrideProvider(LoggingModule)
      .useValue({})
      .compile();

    app = moduleFixture.createNestApplication();
    document = configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it("GET /enterprises/quantsInfo returns fixed companies", async () => {
    const response = await request(app.getHttpServer())
      .get("/enterprises/quantsInfo")
      .set("Cookie", "access_token=fake-token")
      .expect(200);

    expect(response.body.enterprises).toHaveLength(20);
    expect(
      response.body.enterprises.map(
        (item: { companyName: string }) => item.companyName,
      ),
    ).toEqual([
      "NTT",
      "KDDI",
      "ソフトバンク",
      "三菱商事",
      "伊藤忠商事",
      "三井物産",
      "住友商事",
      "丸紅",
      "三菱UFJ FG",
      "三井住友FG",
      "みずほFG",
      "東京海上HD",
      "MS&AD",
      "積水ハウス",
      "オリックス",
      "JT",
      "INPEX",
      "ENEOS HD",
      "武田薬品工業",
      "日本製鉄",
    ]);
    expect(response.body.enterprises[0]).toEqual({
      symbolId: "9432",
      companyName: "NTT",
      sector: "情報・通信業",
      rank: 1,
      totalScore: 92,
      judgement: "安全寄り",
      safetyLabel: "safe",
      scoreBreakdown: {
        fcf: { score: 30, maxScore: 30, isNotApplicable: false },
        dividendCutHistory: { score: 20, maxScore: 20, periodYears: 10 },
        dividendGrowth: { score: 12, maxScore: 15, periodYears: 10 },
        payoutRatio: { score: 15, maxScore: 15 },
        dividendYield: { score: 8, maxScore: 10 },
        financialMetrics: { score: 7, maxScore: 10 },
      },
      latestDividendYield: 3.7,
      isFinancialBusiness: false,
      isFcfNotApplicable: false,
      updatedAt: "2026-06-26T00:00:00.000Z",
      dataAsOfDate: "2026-06-26",
    });
    expect(response.body).toMatchObject({
      updatedAt: "2026-06-26T00:00:00.000Z",
      dataAsOfDate: "2026-06-26",
      isRealtime: false,
      disclaimers: [
        "本画面は配当持続性を分析するためのものであり、特定銘柄の売買を推奨するものではありません。",
      ],
    });
  });

  it("requires access token", async () => {
    await request(app.getHttpServer())
      .get("/enterprises/quantsInfo")
      .expect(401);
  });

  it("GET /enterprises/{symbolId}/dividendAnalysis returns fixed dividend analysis detail", async () => {
    const response = await request(app.getHttpServer())
      .get("/enterprises/8058/dividendAnalysis")
      .set("Cookie", "access_token=fake-token")
      .expect(200);

    expect(Object.keys(response.body)).toEqual(dividendAnalysisResponseKeys);
    expect(response.body).toEqual({
      symbolId: "8058",
      companyName: "三菱商事",
      sector: "商社",
      totalScore: 89,
      judgement: "安全寄り",
      safetyLabel: "safe",
      metrics: {
        fcf: 120000000,
        payoutRatio: 40.9,
        dividendGrowthRate10y: 8.2,
        dividendCutCount10y: 0,
        per: 11.5,
        pbr: 0.9,
        roe: 10.3,
      },
      scoreBreakdown: {
        fcf: {
          score: 24,
          maxScore: 30,
          isNotApplicable: false,
          reason: "3年連続プラス",
        },
        dividendCutHistory: {
          score: 17,
          maxScore: 20,
          periodYears: 10,
          reason: "過去10年で減配なし",
        },
        dividendGrowth: {
          score: 9,
          maxScore: 15,
          periodYears: 10,
          reason: "年平均+8.2%",
        },
        payoutRatio: {
          score: 12,
          maxScore: 15,
          reason: "健全な水準",
        },
        dividendYield: {
          score: 8,
          maxScore: 10,
          reason: "目安レンジ内",
        },
        financialMetrics: {
          score: 7,
          maxScore: 10,
          reason: "PER/PBR/ROEから補助判定",
        },
      },
      analysisSummary: null,
      isFinancialBusiness: false,
      isFcfNotApplicable: false,
      dataSources: [{ name: "J-Quants API mock", asOfDate: "2026-06-26" }],
      updatedAt: "2026-06-26T00:00:00.000Z",
      dataAsOfDate: "2026-06-26",
      scoreVersion: "dividend-score-v1",
      isRealtime: false,
      disclaimers: [
        "本画面は配当持続性を分析するためのものであり、特定銘柄の売買を推奨するものではありません。",
      ],
    });
  });

  it("GET /enterprises/{symbolId}/dividendAnalysis returns nullable FCF for financial businesses", async () => {
    const response = await request(app.getHttpServer())
      .get("/enterprises/8306/dividendAnalysis")
      .set("Cookie", "access_token=fake-token")
      .expect(200);

    expect(response.body.metrics.fcf).toBeNull();
    expect(response.body.scoreBreakdown.fcf).toMatchObject({
      score: null,
      maxScore: 30,
      isNotApplicable: true,
      reason: "金融業はFCFの評価対象外のためN/A",
    });
    expect(response.body.isFinancialBusiness).toBe(true);
    expect(response.body.isFcfNotApplicable).toBe(true);
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
      .get("/enterprises/8058/dividendAnalysis")
      .expect(401);
  });

  it("exposes quants info OpenAPI schema", () => {
    const operation = document.paths["/enterprises/quantsInfo"]?.get;

    expect(operation?.tags).toEqual(["Dividend Analysis"]);
    expect(operation?.summary).toBe("高配当分析向け企業クオンツ情報一覧取得");
    expect(operation?.description).toBe(
      "JWT 認証済みユーザー向けに、保存済みまたは J-Quants API mock 由来の企業クオンツ情報一覧をスコア順で返す。画面リクエスト中に J-Quants API へ同期アクセスしない。未登録銘柄は一覧に含めない。",
    );
    expect(operation?.responses).toMatchObject({
      "200": {},
      "400": {},
      "401": {},
      "500": {},
    });
    expect(document.components?.schemas).toHaveProperty(
      "GetEnterpriseQuantsInfoResponseDto",
    );
    expect(document.components?.schemas).toHaveProperty(
      "EnterpriseQuantInfoDto",
    );
    expect(
      document.components?.schemas?.GetEnterpriseQuantsInfoResponseDto,
    ).toMatchObject({
      properties: {
        enterprises: {
          type: "array",
          items: { $ref: "#/components/schemas/EnterpriseQuantInfoDto" },
        },
        updatedAt: { type: "string", format: "date-time" },
        dataAsOfDate: { type: "string", format: "date" },
        isRealtime: { type: "boolean" },
        disclaimers: { type: "array", items: { type: "string" } },
      },
      required: [
        "enterprises",
        "updatedAt",
        "dataAsOfDate",
        "isRealtime",
        "disclaimers",
      ],
    });
    expect(document.components?.schemas?.EnterpriseQuantInfoDto).toMatchObject({
      properties: {
        symbolId: { type: "string" },
        companyName: { type: "string" },
        sector: { type: "string" },
        rank: { type: "number" },
        totalScore: { type: "number" },
        judgement: { type: "string" },
        safetyLabel: { type: "string" },
        scoreBreakdown: {
          allOf: [{ $ref: "#/components/schemas/EnterpriseScoreBreakdownDto" }],
        },
        latestDividendYield: { type: "number" },
        isFinancialBusiness: { type: "boolean" },
        isFcfNotApplicable: { type: "boolean" },
        updatedAt: { type: "string", format: "date-time" },
        dataAsOfDate: { type: "string", format: "date" },
      },
    });
    expect(Object.keys(document.components?.schemas ?? {})).not.toContain(
      "Entity",
    );
  });

  it("exposes dividend analysis OpenAPI schema", () => {
    const operation =
      document.paths["/enterprises/{symbolId}/dividendAnalysis"]?.get;

    expect(operation?.tags).toEqual(["Dividend Analysis"]);
    expect(operation?.summary).toBe("高配当分析詳細取得");
    expect(operation?.description).toBe(
      "JWT 認証済みユーザー向けに、指定された4桁証券コードの保存済みまたは J-Quants API mock 由来の高配当分析詳細を返す。画面リクエスト中に J-Quants API へ同期アクセスしない。",
    );
    expect(operation?.parameters).toContainEqual(
      expect.objectContaining({
        name: "symbolId",
        in: "path",
        required: true,
        description: "4桁証券コード。例: 8058, 9432。",
      }),
    );
    expect(operation?.responses).toMatchObject({
      "200": {},
      "400": {},
      "401": {},
      "404": {},
      "500": {},
    });
    expect(document.components?.schemas).toHaveProperty(
      "GetEnterpriseDividendAnalysisResponseDto",
    );
    expect(
      document.components?.schemas?.GetEnterpriseDividendAnalysisResponseDto,
    ).toMatchObject({
      properties: {
        symbolId: { type: "string" },
        companyName: { type: "string" },
        sector: { type: "string" },
        totalScore: { type: "number" },
        judgement: { type: "string" },
        safetyLabel: { type: "string" },
        metrics: {
          allOf: [
            {
              $ref: "#/components/schemas/EnterpriseDividendAnalysisMetricsDto",
            },
          ],
        },
        scoreBreakdown: {
          allOf: [
            {
              $ref: "#/components/schemas/EnterpriseDividendAnalysisScoreBreakdownDto",
            },
          ],
        },
        analysisSummary: { type: "string", nullable: true },
        isFinancialBusiness: { type: "boolean" },
        isFcfNotApplicable: { type: "boolean" },
        dataSources: {
          type: "array",
          items: {
            $ref: "#/components/schemas/EnterpriseDividendAnalysisDataSourceDto",
          },
        },
        updatedAt: { type: "string", format: "date-time" },
        dataAsOfDate: { type: "string", format: "date" },
        scoreVersion: { type: "string" },
        isRealtime: { type: "boolean" },
        disclaimers: { type: "array", items: { type: "string" } },
      },
    });
    expect(
      document.components?.schemas?.EnterpriseDividendAnalysisMetricsDto,
    ).toMatchObject({
      properties: {
        fcf: { type: "number", nullable: true },
        payoutRatio: { type: "number" },
        dividendGrowthRate10y: { type: "number" },
        dividendCutCount10y: { type: "number" },
        per: { type: "number" },
        pbr: { type: "number" },
        roe: { type: "number" },
      },
    });
    expect(
      document.components?.schemas?.EnterpriseDividendAnalysisFcfScoreDto,
    ).toMatchObject({
      properties: {
        score: { type: "number", nullable: true },
        maxScore: { type: "number" },
        isNotApplicable: { type: "boolean" },
        reason: { type: "string" },
      },
    });
    expect(Object.keys(document.components?.schemas ?? {})).not.toContain(
      "EnterpriseDividendAnalysisEntity",
    );
    const serializedDocument = JSON.stringify({
      operation,
      schemas: {
        EnterpriseDividendAnalysisMetricsDto:
          document.components?.schemas?.EnterpriseDividendAnalysisMetricsDto,
        EnterpriseDividendAnalysisFcfScoreDto:
          document.components?.schemas?.EnterpriseDividendAnalysisFcfScoreDto,
        EnterpriseDividendAnalysisScoreBreakdownDto:
          document.components?.schemas
            ?.EnterpriseDividendAnalysisScoreBreakdownDto,
        GetEnterpriseDividendAnalysisResponseDto:
          document.components?.schemas
            ?.GetEnterpriseDividendAnalysisResponseDto,
      },
    });
    for (const forbiddenField of [
      "recommendation",
      "prediction",
      "buy",
      "sell",
      "upside",
      "targetPrice",
      "jquantsApiKey",
      "jquantsApiSecret",
    ]) {
      expect(serializedDocument).not.toContain(forbiddenField);
    }
  });
});
