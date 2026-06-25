import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { PassThrough } from "node:stream";
import request from "supertest";

import { configureApp } from "../src/bootstrap";
import { LOG_STREAM } from "../src/common/logging/logging.module";
import { AuthService } from "../src/service/auth/auth.service";
import { AppModule } from "./../src/app.module";

describe("Portfolio analysis (e2e)", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AuthService)
      .useValue({
        verifyAccessToken: jest.fn().mockReturnValue({
          userId: "33333333-3333-3333-3333-333333333333",
        }),
      })
      .overrideProvider(LOG_STREAM)
      .useValue(new PassThrough())
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it("returns the fixed portfolio analysis mock response", async () => {
    await request(app.getHttpServer())
      .get("/portfolio/analysis")
      .query({
        holdingIds:
          "550e8400-e29b-41d4-a716-446655440001,550e8400-e29b-41d4-a716-446655440002",
      })
      .set("Cookie", "access_token=fake-token")
      .expect(200)
      .expect({
        sectorAllocations: [
          { name: "Information Technology", ratio: 30.25 },
          { name: "Financials", ratio: 14.1 },
          { name: "Industrials", ratio: 10.79 },
          { name: "Consumer Discretionary", ratio: 8.95 },
          { name: "Health Care", ratio: 8.87 },
          { name: "Communication Services", ratio: 8.12 },
          { name: "Consumer Staples", ratio: 5.86 },
          { name: "Energy", ratio: 4.63 },
          { name: "Materials", ratio: 3.26 },
          { name: "Utilities", ratio: 2.17 },
          { name: "Real Estate", ratio: 1.09 },
          { name: "Other / Unspecified", ratio: 1.91 },
        ],
        constituents: [
          { name: "NVIDIA Corp.", ratio: 4.6 },
          { name: "Apple Inc.", ratio: 4.15 },
          { name: "Microsoft Corp.", ratio: 3.13 },
          { name: "Alphabet Inc.", ratio: 3.51 },
          { name: "Amazon.com Inc.", ratio: 2.39 },
          { name: "Broadcom Inc.", ratio: 1.85 },
          { name: "Taiwan Semiconductor Manufacturing Co. Ltd.", ratio: 1.16 },
          { name: "Tesla Inc.", ratio: 1.13 },
          { name: "Meta Platforms Inc.", ratio: 1.25 },
          { name: "Qualcomm Inc.", ratio: 0.64 },
        ],
        countryAllocations: [
          { name: "United States", ratio: 70.76 },
          { name: "Japan", ratio: 4.26 },
          { name: "United Kingdom", ratio: 2.37 },
          { name: "Taiwan", ratio: 2.31 },
          { name: "Canada", ratio: 2.25 },
          { name: "South Korea", ratio: 2.16 },
          { name: "Switzerland", ratio: 1.55 },
          { name: "France", ratio: 1.45 },
          { name: "Germany", ratio: 1.41 },
          { name: "China", ratio: 0.85 },
          { name: "Australia", ratio: 0.49 },
          { name: "Other / Unspecified", ratio: 10.14 },
        ],
        lastUpdated: "2026-06-22T00:00:00.000Z",
      });
  });

  it("rejects invalid holdingIds", async () => {
    await request(app.getHttpServer())
      .get("/portfolio/analysis")
      .query({ holdingIds: "not-a-uuid" })
      .set("Cookie", "access_token=fake-token")
      .expect(400);
  });

  it("publishes the portfolio analysis contract in OpenAPI", async () => {
    const { body: document } = await request(app.getHttpServer())
      .get("/docs-json")
      .expect(200);

    const operation = document.paths["/portfolio/analysis"]?.get;

    expect(operation).toMatchObject({
      tags: ["Portfolio"],
      summary: "holdings と限定商品マスタからポートフォリオ分析を取得する",
      responses: {
        "200": {
          description: "ポートフォリオ分析結果の取得に成功しました",
        },
        "400": { description: "リクエストが不正です" },
        "401": { description: "未認証" },
        "404": { description: "指定された保有商品が見つかりません" },
        "500": { description: "想定外エラー" },
      },
    });
    expect(operation?.description).toContain(
      "product master / Entity / internal model は OpenAPI に公開せず",
    );
    expect(operation?.parameters).toContainEqual(
      expect.objectContaining({
        in: "query",
        name: "holdingIds",
        required: true,
      }),
    );
    expect(operation?.responses["200"]).toMatchObject({
      content: {
        "application/json": {
          schema: {
            $ref: "#/components/schemas/GetPortfolioAnalysisResponseDto",
          },
        },
      },
    });
    expect(Object.keys(document.components.schemas)).not.toContain("Entity");
  });
});
