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
          { name: "Information Technology", ratio: 24.5 },
          { name: "Financials", ratio: 12.3 },
        ],
        constituents: [
          { name: "Apple Inc.", ratio: 4.8 },
          { name: "Microsoft Corp.", ratio: 4.2 },
        ],
        countryAllocations: [
          { name: "United States", ratio: 62.1 },
          { name: "Japan", ratio: 5.5 },
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
