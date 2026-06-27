import {
  Controller,
  Get,
  type INestApplication,
  Logger as NestLogger,
} from "@nestjs/common";
import { ApiExcludeController, type OpenAPIObject } from "@nestjs/swagger";
import { Test, type TestingModule } from "@nestjs/testing";
import { Logger } from "nestjs-pino";
import type { NextFunction, Request, Response } from "express";
import request from "supertest";
import type { App } from "supertest/types";
import { AppModule } from "./../src/app.module";
import { configureApp } from "./../src/bootstrap";
import { LOG_STREAM } from "./../src/common/logging/logging.module";
import { TodoResource } from "./../src/resource/todo/todo.resource";
import { AuthService } from "./../src/service/auth/auth.service";

@ApiExcludeController()
@Controller("_test")
class TestErrorController {
  private readonly logger = new NestLogger(TestErrorController.name);

  @Get("error")
  error(): never {
    throw new Error("test failure");
  }

  @Get("nest-log")
  nestLog(): { ok: true } {
    this.logger.log({
      event: "test.nest-log",
      nested: {
        password: "nest-secret",
        safe: "visible",
      },
    });
    return { ok: true };
  }
}

describe("Users API (e2e)", () => {
  let app: INestApplication<App>;
  let openApiDocument: OpenAPIObject;
  let logLines: string[];
  const currentUser = {
    subject: "33333333-3333-3333-3333-333333333333",
    displayName: "User 1",
  };
  const accessTokenCookie = "access_token=fake-token";
  const todoResource = {
    create: jest.fn(async ({ title }: { title: string }) => ({
      id: "todo-3",
      owner_user_id: currentUser.subject,
      title,
      completed: false,
      created_at: "2026-06-05T02:00:00.000Z",
      updated_at: "2026-06-05T02:00:00.000Z",
    })),
    deleteByIdForOwner: jest.fn(async () => true),
    findByIdForOwner: jest.fn(async () => ({
      id: "11111111-1111-1111-1111-111111111111",
      owner_user_id: currentUser.subject,
      title: "新しいTODO",
      completed: false,
      created_at: "2026-06-05T02:00:00.000Z",
      updated_at: "2026-06-05T02:00:00.000Z",
    })),
    findManyByOwner: jest.fn(async () => [
      {
        id: "11111111-1111-1111-1111-111111111111",
        owner_user_id: currentUser.subject,
        title: "新しいTODO",
        completed: false,
        created_at: "2026-06-05T02:00:00.000Z",
        updated_at: "2026-06-05T02:00:00.000Z",
      },
      {
        id: "todo-old",
        owner_user_id: currentUser.subject,
        title: "完了済みTODO",
        completed: true,
        created_at: "2026-06-05T01:00:00.000Z",
        updated_at: "2026-06-05T01:00:00.000Z",
      },
    ]),
    updateCompletedByIdForOwner: jest.fn(async () => ({
      id: "11111111-1111-1111-1111-111111111111",
      owner_user_id: currentUser.subject,
      title: "新しいTODO",
      completed: true,
      created_at: "2026-06-05T02:00:00.000Z",
      updated_at: "2026-06-05T02:00:00.000Z",
    })),
  };

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
    logLines = [];
    jest.clearAllMocks();
    const logStream = {
      write: (line: string): boolean => {
        logLines.push(line);
        return true;
      },
    };
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [TestErrorController],
    })
      .overrideProvider(LOG_STREAM)
      .useValue(logStream)
      .overrideProvider(TodoResource)
      .useValue(todoResource)
      .overrideProvider(AuthService)
      .useValue({
        verifyAccessToken: jest.fn(async () => currentUser),
      })
      .compile();

    app = moduleFixture.createNestApplication({ bodyParser: false });
    app.useLogger(app.get(Logger));
    app.use((req: Request, _res: Response, next: NextFunction): void => {
      const cookieHeader = req.headers.cookie;
      req.headers.cookie =
        typeof cookieHeader === "string" && cookieHeader.length > 0
          ? `${cookieHeader}; access_token=test-token`
          : "access_token=test-token";
      next();
    });
    app.use(parseJsonBody);
    openApiDocument = configureApp(app);

    await app.init();
  });

  it("generates a request id and returns it without changing the body", async () => {
    const response = await request(app.getHttpServer())
      .get("/todos")
      .set("Cookie", accessTokenCookie)
      .expect(200);
    expect(response.headers["x-request-id"]).toEqual(
      expect.stringMatching(/^[0-9a-f-]{36}$/),
    );
    expect(response.body).toEqual(expect.any(Array));
  });

  it("reuses a safe request id", async () => {
    const response = await request(app.getHttpServer())
      .get("/todos")
      .set("Cookie", accessTokenCookie)
      .set("x-request-id", "request-123")
      .expect(200);

    expect(response.headers["x-request-id"]).toBe("request-123");
    const correlatedLogs = logLines
      .map((line) => JSON.parse(line) as Record<string, unknown>)
      .filter((line) => line.requestId === "request-123");
    expect(correlatedLogs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: "http.request.completed",
          path: "/todos",
        }),
      ]),
    );
  });

  it("replaces an unsafe request id", async () => {
    const response = await request(app.getHttpServer())
      .get("/todos")
      .set("Cookie", accessTokenCookie)
      .set("x-request-id", "unsafe request id")
      .expect(200);

    expect(response.headers["x-request-id"]).not.toBe("unsafe request id");
  });

  it("keeps the standard response for an unhandled exception", () => {
    return request(app.getHttpServer())
      .get("/_test/error")
      .set("Cookie", accessTokenCookie)
      .expect(500)
      .expect({
        statusCode: 500,
        message: "Internal server error",
      });
  });

  it("writes minimal access logs without body, query, or credentials", async () => {
    await request(app.getHttpServer())
      .post("/todos?token=query-secret")
      .set("Cookie", accessTokenCookie)
      .set("authorization", "Bearer header-secret")
      .set("cookie", "session=cookie-secret")
      .send({ title: "body-secret" })
      .expect(201);

    const serializedLogs = logLines.join("");
    expect(serializedLogs).not.toContain("query-secret");
    expect(serializedLogs).not.toContain("header-secret");
    expect(serializedLogs).not.toContain("cookie-secret");
    expect(serializedLogs).not.toContain("body-secret");

    const accessLog = logLines
      .map((line) => JSON.parse(line) as Record<string, unknown>)
      .find((line) => line.msg === "request completed");
    expect(accessLog).toMatchObject({
      level: 30,
      event: "http.request.completed",
      method: "POST",
      path: "/todos",
      status: 201,
      requestId: expect.any(String),
      duration: expect.any(Number),
      ip: expect.any(String),
    });
    expect(accessLog).not.toHaveProperty("req");
    expect(accessLog).not.toHaveProperty("query");
    expect(accessLog).not.toHaveProperty("body");
  });

  it("exposes x-request-id through CORS", async () => {
    const response = await request(app.getHttpServer())
      .options("/todos")
      .set("Cookie", accessTokenCookie)
      .set("origin", "http://localhost:3000")
      .set("access-control-request-method", "GET")
      .expect(204);

    expect(response.headers["access-control-expose-headers"]).toContain(
      "x-request-id",
    );
  });

  it("sanitizes structured fields emitted through the Nest logger", async () => {
    await request(app.getHttpServer())
      .get("/_test/nest-log")
      .set("Cookie", accessTokenCookie)
      .expect(200);

    const serializedLogs = logLines.join("");
    expect(serializedLogs).not.toContain("nest-secret");
    const nestLog = logLines
      .map((line) => JSON.parse(line) as Record<string, unknown>)
      .find((line) => line.event === "test.nest-log");
    expect(nestLog).toMatchObject({
      nested: {
        password: "[Redacted]",
        safe: "visible",
      },
    });
  });

  it.each([
    [400, "/todos", "warn", 40],
    [500, "/_test/error", "error", 50],
  ])(
    "logs HTTP %i access at %s level",
    async (status, path, _level, numericLevel) => {
      const response =
        status === 400
          ? request(app.getHttpServer())
              .post(path)
              .set("Cookie", accessTokenCookie)
              .send({})
          : request(app.getHttpServer())
              .get(path)
              .set("Cookie", accessTokenCookie);

      await response.expect(status);

      const accessLog = logLines
        .map((line) => JSON.parse(line) as Record<string, unknown>)
        .find(
          (line) =>
            line.path === path &&
            line.status === status &&
            (line.msg === "request completed" || line.msg === "request failed"),
        );
      expect(accessLog?.level).toBe(numericLevel);
    },
  );

  it("publishes the endpoint in the OpenAPI document", () => {
    expect(Object.keys(openApiDocument.paths)).toEqual(
      expect.arrayContaining(["/todos", "/todos/{id}"]),
    );
    expect(openApiDocument.paths["/todos/{id}"]?.get).toMatchObject({
      summary: "TODO取得",
      tags: ["todos"],
      responses: {
        200: {
          description: "TODO情報",
        },
        400: {
          description: "不正なリクエスト",
        },
        500: {
          description: "サーバーエラー",
        },
      },
    });
    expect(
      openApiDocument.components?.schemas?.GetUserEntityResponse,
    ).toBeUndefined();
  });

  it("POST /todos creates a TODO item with the trimmed request title", () => {
    return request(app.getHttpServer())
      .post("/todos")
      .set("Cookie", accessTokenCookie)
      .send({ title: "  請求書を確認する  " })
      .expect(201)
      .expect({
        id: "todo-3",
        title: "請求書を確認する",
        completed: false,
        createdAt: "2026-06-05T02:00:00.000Z",
      });
  });

  it("GET /todos returns TODO items ordered by newest createdAt first", () => {
    return request(app.getHttpServer())
      .get("/todos")
      .set("Cookie", accessTokenCookie)
      .expect(200)
      .expect([
        {
          id: "11111111-1111-1111-1111-111111111111",
          title: "新しいTODO",
          completed: false,
          createdAt: "2026-06-05T02:00:00.000Z",
        },
        {
          id: "todo-old",
          title: "完了済みTODO",
          completed: true,
          createdAt: "2026-06-05T01:00:00.000Z",
        },
      ]);
  });

  it("DELETE /todos/:id returns 204 with no response body", async () => {
    const response = await request(app.getHttpServer())
      .delete("/todos/11111111-1111-1111-1111-111111111111")
      .set("Cookie", accessTokenCookie)
      .expect(204);

    expect(response.text).toBe("");
  });

  it("validates POST /todos request body", async () => {
    const missingTitle = await request(app.getHttpServer())
      .post("/todos")
      .set("Cookie", accessTokenCookie)
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
      .set("Cookie", accessTokenCookie)
      .send({ title: "あ".repeat(81) })
      .expect(400);
    expect(
      Array.isArray((tooLongTitle.body as { message?: unknown }).message),
    ).toBe(true);
    expect((tooLongTitle.body as { message?: unknown[] }).message).toContain(
      "TODOは80文字以内で入力してください",
    );
  });

  it("PATCH /todos/:id returns the updated TODO item", () => {
    return request(app.getHttpServer())
      .patch("/todos/22222222-2222-2222-2222-222222222222")
      .set("Cookie", accessTokenCookie)
      .send({ completed: true })
      .expect(200)
      .expect({
        id: "11111111-1111-1111-1111-111111111111",
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
      .patch("/todos/22222222-2222-2222-2222-222222222222")
      .set("Cookie", accessTokenCookie)
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
        "ログイン済みユーザーのTODOとして、指定されたタイトルで新しいTODOを作成する。作成直後の completed は false として返す。",
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
        401: {
          description: "認証エラー",
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
      description:
        "ログイン済みユーザーが所有する指定TODOの完了状態を更新し、更新後のTODOを返す。",
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
        401: {
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

  it("publishes GET /todos in the OpenAPI document", () => {
    expect(openApiDocument.paths["/todos"]?.get).toMatchObject({
      summary: "TODO一覧取得",
      description:
        "ログイン済みユーザーのTODO一覧を作成日時の新しい順で取得する。",
      tags: ["todos"],
      responses: {
        200: {
          description: "TODO一覧",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: {
                  $ref: "#/components/schemas/TodoDto",
                },
              },
            },
          },
        },
        500: {
          description: "サーバーエラー",
        },
        401: {
          description: "認証エラー",
        },
      },
    });
    expect(openApiDocument.components?.schemas?.TodoDto).toBeDefined();
    expect(
      openApiDocument.components?.schemas?.GetUserEntityRequest,
    ).toBeUndefined();
    expect(
      openApiDocument.components?.schemas?.GetUserEntityResponse,
    ).toBeUndefined();
  });

  it("publishes DELETE /todos/:id in the OpenAPI document", () => {
    const operation = openApiDocument.paths["/todos/{id}"]?.delete;
    expect(operation).toMatchObject({
      summary: "TODO削除",
      description:
        "ログイン済みユーザーが所有する指定TODOを削除する。成功時はレスポンス body を返さない。",
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
      responses: {
        204: {
          description: "TODO削除成功",
        },
        404: {
          description: "TODOが見つかりません",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponseSchema",
              },
            },
          },
        },
        401: {
          description: "認証エラー",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponseSchema",
              },
            },
          },
        },
        500: {
          description: "サーバーエラー",
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
    expect(operation?.responses[204]).not.toHaveProperty("content");
    expect(
      openApiDocument.components?.schemas?.ErrorResponseSchema,
    ).toMatchObject({
      required: ["message"],
      properties: {
        message: {
          type: "string",
        },
      },
    });
    expect(
      openApiDocument.components?.schemas?.GetUserEntityRequest,
    ).toBeUndefined();
    expect(
      openApiDocument.components?.schemas?.GetUserEntityResponse,
    ).toBeUndefined();
  });

  it("serves Swagger UI at /docs", () => {
    return request(app.getHttpServer())
      .get("/docs")
      .set("Cookie", accessTokenCookie)
      .expect(200)
      .expect("content-type", /text\/html/);
  });

  it("serves OpenAPI JSON at /docs-json without Entity schemas", async () => {
    const response = await request(app.getHttpServer())
      .get("/docs-json")
      .set("Cookie", accessTokenCookie)
      .expect(200)
      .expect("content-type", /application\/json/);

    const document = response.body as OpenAPIObject;

    expect(Object.keys(document.paths)).toEqual([
      
       "/enterprises/quantsInfo",
      "/auth/google/login",
      "/auth/google/callback",
      "/auth/me",
      "/auth/logout",
      "/portfolio/holdings",
      "/portfolio/analysis",
      "/todos",
      "/todos/{id}",
    ]);
    expect(document.paths["/todos"]).toBeDefined();
    expect(document.paths["/todos"]?.get?.tags).toEqual(["todos"]);
    expect(document.paths["/todos"]?.post?.tags).toEqual(["todos"]);
    expect(document.paths["/todos/{id}"]?.delete?.tags).toEqual(["todos"]);
    expect(document.components?.schemas?.CreateTodoRequestDto).toBeDefined();
    expect(document.components?.schemas?.TodoDto).toBeDefined();
    expect(document.components?.schemas?.GetUserEntityRequest).toBeUndefined();
    expect(document.components?.schemas?.GetUserEntityResponse).toBeUndefined();
  });

  afterEach(async () => {
    await app?.close();
  });
});
