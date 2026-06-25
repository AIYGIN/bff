import type { INestApplication } from "@nestjs/common";
import type { OpenAPIObject } from "@nestjs/swagger";
import { Test } from "@nestjs/testing";
import { PassThrough } from "node:stream";
import request from "supertest";
import type { App } from "supertest/types";

import { configureApp } from "../src/bootstrap";
import { LOG_STREAM } from "../src/common/logging/logging.module";
import { AppModule } from "../src/app.module";
import { AuthService } from "../src/service/auth/auth.service";

describe("Portfolio holdings API (e2e)", () => {
  let app: INestApplication<App>;
  let openApiDocument: OpenAPIObject;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(LOG_STREAM)
      .useValue(new PassThrough())
      .overrideProvider(AuthService)
      .useValue({
        verifyAccessToken: jest.fn(async () => ({
          subject: "33333333-3333-3333-3333-333333333333",
          displayName: "User 1",
        })),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    openApiDocument = configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it("returns fixed mock holdings for an authenticated request", async () => {
    await request(app.getHttpServer())
      .get("/portfolio/holdings")
      .set("Cookie", "access_token=fake-token")
      .expect(200)
      .expect({
        holdings: [
          {
            holdingId: "550e8400-e29b-41d4-a716-446655440001",
            productName: "eMAXIS Slim 全世界株式（オール・カントリー）",
            ratio: 60,
          },
          {
            holdingId: "550e8400-e29b-41d4-a716-446655440002",
            productName: "SBI・V・S&P500インデックス・ファンド",
            ratio: 40,
          },
        ],
        lastUpdated: "2026-06-22T00:00:00.000Z",
      });
  });

  it("requires JwtAuthGuard", async () => {
    await request(app.getHttpServer()).get("/portfolio/holdings").expect(401);
  });

  it("documents the OpenAPI contract", () => {
    const operation = openApiDocument.paths["/portfolio/holdings"]?.get;

    expect(operation).toMatchObject({
      tags: ["Portfolio"],
      summary: "ポートフォリオ保有商品を取得する",
      responses: {
        "200": {
          description: "ポートフォリオ保有商品の取得に成功しました",
        },
        "401": {
          description: "未認証",
        },
        "404": {
          description: "holdings 未登録",
        },
        "500": {
          description: "想定外エラー",
        },
      },
    });
    expect(operation?.parameters).toEqual([]);
    expect(operation?.requestBody).toBeUndefined();
    expect(openApiDocument.paths["/api/portfolio/holdings"]).toBeUndefined();
    expect(
      openApiDocument.components?.schemas?.GetPortfolioHoldingsResponseDto,
    ).toMatchObject({
      properties: {
        holdings: {
          type: "array",
          items: {
            $ref: "#/components/schemas/PortfolioHoldingDto",
          },
        },
        lastUpdated: {
          type: "string",
        },
      },
    });
    expect(
      openApiDocument.components?.schemas?.PortfolioHoldingDto,
    ).toMatchObject({
      properties: {
        holdingId: {
          type: "string",
          format: "uuid",
        },
        productName: {
          type: "string",
        },
        ratio: {
          type: "number",
          minimum: 0,
          maximum: 100,
        },
      },
    });
    const portfolioHoldingProperties = openApiDocument.components
      ?.schemas?.PortfolioHoldingDto as
      | { properties?: Record<string, unknown> }
      | undefined;
    expect(portfolioHoldingProperties?.properties).not.toHaveProperty(
      "productId",
    );
    expect(Object.keys(openApiDocument.components?.schemas ?? {})).not.toEqual(
      expect.arrayContaining([expect.stringMatching(/Entity/)]),
    );
  });
});
