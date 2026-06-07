import { INestApplication, ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from "@nestjs/swagger";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { App } from "supertest/types";
import { AppModule } from "./../src/app.module";

describe("Users API (e2e)", () => {
  let app: INestApplication<App>;
  let openApiDocument: OpenAPIObject;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    const swaggerConfig = new DocumentBuilder()
      .setTitle("BFF API")
      .setDescription("Frontend 向け BFF API")
      .setVersion("1.0")
      .addBearerAuth()
      .build();

    openApiDocument = SwaggerModule.createDocument(app, swaggerConfig, {
      autoTagControllers: false,
    });
    SwaggerModule.setup("docs", app, openApiDocument, {
      jsonDocumentUrl: "docs-json",
    });

    await app.init();
  });

  it("GET /users/:userId returns a user", () => {
    return request(app.getHttpServer())
      .get("/users/user_123")
      .expect(200)
      .expect({
        id: "user_123",
        name: "Sample User",
      });
  });

  it("publishes the endpoint in the OpenAPI document", () => {
    expect(Object.keys(openApiDocument.paths)).toEqual(["/users/{userId}"]);
    expect(openApiDocument.paths["/users/{userId}"]?.get).toMatchObject({
      summary: "ユーザー取得",
      tags: ["users"],
      responses: {
        200: {
          description: "ユーザー情報",
        },
        400: {
          description: "不正なリクエスト",
        },
        500: {
          description: "サーバーエラー",
        },
      },
    });
    expect(openApiDocument.components?.schemas?.UserDto).toBeDefined();
    expect(
      openApiDocument.components?.schemas?.GetUserEntityResponse,
    ).toBeUndefined();
  });

  it("serves Swagger UI at /docs", () => {
    return request(app.getHttpServer())
      .get("/docs")
      .expect(200)
      .expect("content-type", /text\/html/);
  });

  it("serves OpenAPI JSON at /docs-json without Entity schemas", async () => {
    const response = await request(app.getHttpServer())
      .get("/docs-json")
      .expect(200)
      .expect("content-type", /application\/json/);

    const document = response.body as OpenAPIObject;

    expect(Object.keys(document.paths)).toEqual(["/users/{userId}"]);
    expect(document.paths["/users/{userId}"]).toBeDefined();
    expect(document.paths["/users/{userId}"]?.get?.tags).toEqual(["users"]);
    expect(document.components?.schemas?.UserDto).toBeDefined();
    expect(document.components?.schemas?.GetUserEntityRequest).toBeUndefined();
    expect(document.components?.schemas?.GetUserEntityResponse).toBeUndefined();
  });

  afterEach(async () => {
    await app.close();
  });
});
