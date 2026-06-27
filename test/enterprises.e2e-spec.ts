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

    expect(response.body.ranking).toHaveLength(20);
    expect(
      response.body.ranking.map((item: { name: string }) => item.name),
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
    expect(response.body.ranking[0]).toMatchObject({
      name: "NTT",
      prediction: 30,
      buy: 30,
      sell: 10,
      upside: 12,
    });
    expect(response.body.lastUpdated).toBe("2026-06-26");
  });

  it("requires access token", async () => {
    await request(app.getHttpServer())
      .get("/enterprises/quantsInfo")
      .expect(401);
  });

  it("exposes OpenAPI schema", () => {
    const operation = document.paths["/enterprises/quantsInfo"]?.get;

    expect(operation?.tags).toEqual(["enterprises"]);
    expect(operation?.summary).toBe("企業クオンツ情報取得");
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
    expect(Object.keys(document.components?.schemas ?? {})).not.toContain(
      "Entity",
    );
  });
});
