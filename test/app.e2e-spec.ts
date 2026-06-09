import { INestApplication, ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from "@nestjs/swagger";
import { Test, TestingModule } from "@nestjs/testing";
import { NextFunction, Request, Response } from "express";
import request from "supertest";
import { App } from "supertest/types";
import { AppModule } from "./../src/app.module";

describe("Users API (e2e)", () => {
  let app: INestApplication<App>;
  let openApiDocument: OpenAPIObject;

  const parseJsonBody = (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): void => {
    const contentType = req.headers["content-type"];

    if (
      !["POST", "PUT", "PATCH"].includes(req.method) ||
      typeof contentType !== "string" ||
      !contentType.includes("application/json")
    ) {
      next();
      return;
    }

    let data = "";
    req.setEncoding("utf8");
    req.on("data", (chunk: string) => {
      data += chunk;
    });
    req.on("end", () => {
      try {
        const parsed = (data.length === 0 ? {} : JSON.parse(data)) as unknown;
        req.body = parsed;
        next();
      } catch (error) {
        next(error);
      }
    });
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication({ bodyParser: false });
    app.use(parseJsonBody);
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
    expect(Object.keys(openApiDocument.paths)).toEqual([
      "/users/{userId}",
      "/todos",
      "/todos/{id}",
    ]);
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

  it("POST /todos creates a TODO mock with the trimmed request title", () => {
    return request(app.getHttpServer())
      .post("/todos")
      .send({ title: "  請求書を確認する  " })
      .expect(201)
      .expect({
        id: "todo-3",
        title: "請求書を確認する",
        completed: false,
        createdAt: "2026-06-05T02:00:00.000Z",
      });
  });

  it("validates POST /todos request body", async () => {
    const missingTitle = await request(app.getHttpServer())
      .post("/todos")
      .send({})
      .expect(400);
    expect(
      Array.isArray((missingTitle.body as { message?: unknown }).message),
    ).toBe(true);
    expect((missingTitle.body as { message?: unknown[] }).message).toContain(
      "TODOを入力してください",
    );

    const tooLongTitle = await request(app.getHttpServer())
      .post("/todos")
      .send({ title: "あ".repeat(81) })
      .expect(400);
    expect(
      Array.isArray((tooLongTitle.body as { message?: unknown }).message),
    ).toBe(true);
    expect((tooLongTitle.body as { message?: unknown[] }).message).toContain(
      "TODOは80文字以内で入力してください",
    );
  });

  it("PATCH /todos/:id returns the updated TODO mock", () => {
    return request(app.getHttpServer())
      .patch("/todos/todo-123")
      .send({ completed: true })
      .expect(200)
      .expect({
        id: "todo-new",
        title: "新しいTODO",
        completed: true,
        createdAt: "2026-06-05T02:00:00.000Z",
      });
  });

  it.each([
    ["missing completed", {}],
    ["non-boolean completed", { completed: "true" }],
  ])("validates PATCH /todos/:id request body: %s", async (_name, body) => {
    const response = await request(app.getHttpServer())
      .patch("/todos/todo-123")
      .send(body)
      .expect(400);

    expect(
      Array.isArray((response.body as { message?: unknown }).message),
    ).toBe(true);
    expect((response.body as { message?: unknown[] }).message).toContain(
      "完了状態を指定してください",
    );
  });

  it("publishes POST /todos in the OpenAPI document", () => {
    expect(openApiDocument.paths["/todos"]?.post).toMatchObject({
      summary: "TODO作成",
      description:
        "指定されたタイトルで新しいTODOを作成する。作成直後の completed は false として返す。",
      tags: ["todos"],
      requestBody: {
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/CreateTodoRequestDto",
            },
          },
        },
      },
      responses: {
        201: {
          description: "作成されたTODO",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/TodoDto",
              },
            },
          },
        },
        400: {
          description: "リクエストボディのバリデーションエラー",
        },
        500: {
          description: "サーバーエラー",
        },
      },
    });
    expect(
      openApiDocument.components?.schemas?.CreateTodoRequestDto,
    ).toMatchObject({
      required: ["title"],
      properties: {
        title: {
          type: "string",
          minLength: 1,
          maxLength: 80,
        },
      },
    });
    expect(openApiDocument.components?.schemas?.TodoDto).toMatchObject({
      required: ["id", "title", "completed", "createdAt"],
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        completed: { type: "boolean" },
        createdAt: { type: "string", format: "date-time" },
      },
    });
    expect(
      openApiDocument.components?.schemas?.GetUserEntityResponse,
    ).toBeUndefined();
  });

  it("publishes PATCH /todos/:id in the OpenAPI document", () => {
    expect(openApiDocument.paths["/api/todos/{id}"]).toBeUndefined();
    expect(openApiDocument.paths["/todos/{id}"]?.patch).toMatchObject({
      summary: "TODO完了状態更新",
      description: "指定したTODOの完了状態を更新し、更新後のTODOを返す。",
      tags: ["todos"],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: {
            type: "string",
          },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/UpdateTodoRequestDto",
            },
          },
        },
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/TodoDto",
              },
            },
          },
        },
        400: {
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponseSchema",
              },
            },
          },
        },
        404: {
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponseSchema",
              },
            },
          },
        },
        500: {
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponseSchema",
              },
            },
          },
        },
      },
    });
    expect(
      openApiDocument.components?.schemas?.UpdateTodoRequestDto,
    ).toMatchObject({
      required: ["completed"],
      properties: {
        completed: {
          type: "boolean",
        },
      },
    });
    expect(openApiDocument.components?.schemas?.TodoDto).toBeDefined();
    expect(
      Object.keys(openApiDocument.components?.schemas ?? {}).some((schema) =>
        schema.includes("Entity"),
      ),
    ).toBe(false);
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

    expect(Object.keys(document.paths)).toEqual([
      "/users/{userId}",
      "/todos",
      "/todos/{id}",
    ]);
    expect(document.paths["/users/{userId}"]).toBeDefined();
    expect(document.paths["/users/{userId}"]?.get?.tags).toEqual(["users"]);
    expect(document.paths["/todos"]).toBeDefined();
    expect(document.paths["/todos"]?.post?.tags).toEqual(["todos"]);
    expect(document.components?.schemas?.UserDto).toBeDefined();
    expect(document.components?.schemas?.CreateTodoRequestDto).toBeDefined();
    expect(document.components?.schemas?.TodoDto).toBeDefined();
    expect(document.components?.schemas?.GetUserEntityRequest).toBeUndefined();
    expect(document.components?.schemas?.GetUserEntityResponse).toBeUndefined();
  });

  afterEach(async () => {
    await app.close();
  });
});
