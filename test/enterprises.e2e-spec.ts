import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { type OpenAPIObject } from "@nestjs/swagger";
import request from "supertest";

import { configureApp } from "../src/bootstrap";
import { LoggingModule } from "../src/common/logging/logging.module";
import { AuthService } from "../src/service/auth/auth.service";
import { AppModule } from "./../src/app.module";

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

  it("exposes OpenAPI schema", () => {
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
});
