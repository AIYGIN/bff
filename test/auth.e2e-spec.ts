import type { INestApplication } from "@nestjs/common";
import type { OpenAPIObject } from "@nestjs/swagger";
import { Test, type TestingModule } from "@nestjs/testing";
import request from "supertest";
import type { App } from "supertest/types";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/bootstrap";

describe("Auth API (e2e)", () => {
  let app: INestApplication<App>;
  let openApiDocument: OpenAPIObject;

  beforeEach(async () => {
    const moduleFixture: TestingModule =
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

    app = moduleFixture.createNestApplication();
    openApiDocument = configureApp(app);
    await app.init();
  });

  it("GET /auth/google/login sets OAuth Cookie and redirects", async () => {
    const response = await request(app.getHttpServer())
      .get("/auth/google/login")
      .expect(302);

    expect(response.headers.location).toBe(
      "https://accounts.google.com/o/oauth2/v2/auth?client_id=mock-google-client-id&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fauth%2Fgoogle%2Fcallback&response_type=code&scope=openid%20profile%20email&state=mock-oauth-state&code_challenge=mock-code-challenge&code_challenge_method=S256",
    );
    expect(response.headers["set-cookie"]).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "google_oauth_state=mock-signed-oauth-state-pkce",
        ),
        expect.stringContaining("HttpOnly"),
        expect.stringContaining("SameSite=Lax"),
      ]),
    );
  });

  it("GET /auth/google/callback handles a successful callback", async () => {
    const response = await request(app.getHttpServer())
      .get("/auth/google/callback")
      .query({ code: "mock-code", state: "mock-oauth-state" })
      .expect(302);

    expect(response.headers.location).toBe(
      "http://localhost:3000/auth/success",
    );
    expect(response.headers["set-cookie"]).toEqual(
      expect.arrayContaining([
        expect.stringContaining("access_token=mock-bff-access-token"),
        expect.stringMatching(
          /^google_oauth_state=; Path=\/; Expires=/,
        ),
      ]),
    );
  });

  it("GET /auth/google/callback handles a Provider error", async () => {
    const response = await request(app.getHttpServer())
      .get("/auth/google/callback")
      .query({ error: "access_denied", state: "mock-oauth-state" })
      .expect(302);

    expect(response.headers.location).toBe(
      "http://localhost:3000/auth/failure",
    );
    expect(response.headers.location).not.toContain("access_denied");
    expect(response.headers["set-cookie"]).toEqual(
      expect.arrayContaining([
        expect.stringMatching(
          /^google_oauth_state=; Path=\/; Expires=/,
        ),
      ]),
    );
  });

  it.each([
    ["missing state", { code: "mock-code" }],
    [
      "code and error together",
      {
        code: "mock-code",
        error: "access_denied",
        state: "mock-oauth-state",
      },
    ],
    ["neither code nor error", { state: "mock-oauth-state" }],
  ])("rejects callback query with %s", async (_name, query) => {
    await request(app.getHttpServer())
      .get("/auth/google/callback")
      .query(query)
      .expect(400);
  });

  it("GET /auth/me returns the fixed display profile", () => {
    return request(app.getHttpServer()).get("/auth/me").expect(200).expect({
      displayName: "Sample User",
      profileImageUrl: "https://example.com/profile.jpg",
    });
  });

  it("POST /auth/logout clears access Cookie with no response body", async () => {
    const response = await request(app.getHttpServer())
      .post("/auth/logout")
      .expect(204);

    expect(response.text).toBe("");
    expect(response.headers["set-cookie"]).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^access_token=; Path=\/; Expires=/),
      ]),
    );
  });

  it("publishes the complete Auth contract in OpenAPI", () => {
    expect(Object.keys(openApiDocument.paths)).toEqual(
      expect.arrayContaining([
        "/auth/google/login",
        "/auth/google/callback",
        "/auth/me",
        "/auth/logout",
      ]),
    );

    expect(openApiDocument.paths["/auth/google/login"]?.get).toMatchObject({
      tags: ["auth"],
      summary: "Google ログイン開始",
      description:
        "OAuth state と PKCE 情報を一時 Cookie に保存し、Google 認可画面へリダイレクトする。",
      responses: {
        302: {
          description: "Google 認可画面へリダイレクト",
          headers: {
            Location: {
              schema: { type: "string", format: "uri" },
            },
            "Set-Cookie": {
              schema: { type: "string" },
            },
          },
        },
        500: {
          description: "サーバーエラー",
        },
      },
    });

    expect(
      openApiDocument.paths["/auth/google/callback"]?.get,
    ).toMatchObject({
      tags: ["auth"],
      summary: "Google OAuth コールバック",
      description:
        "state と code または error のどちらか一方を受け取る。成功時は BFF access token Cookie を設定して Frontend へリダイレクトし、失敗時は Provider 詳細を公開せず失敗 URL へリダイレクトする。",
      parameters: expect.arrayContaining([
        expect.objectContaining({
          name: "code",
          in: "query",
          required: false,
        }),
        expect.objectContaining({
          name: "state",
          in: "query",
          required: true,
        }),
        expect.objectContaining({
          name: "error",
          in: "query",
          required: false,
        }),
      ]),
      responses: {
        302: {
          description: "Frontend へリダイレクト",
        },
        400: {
          description: "不正な callback query",
        },
        500: {
          description: "サーバーエラー",
        },
      },
    });

    expect(openApiDocument.paths["/auth/me"]?.get).toMatchObject({
      tags: ["auth"],
      summary: "認証ユーザー取得",
      description:
        "BFF access token Cookie を検証し、識別子を含まない表示用ユーザー情報を返す。未認証時はリダイレクトせず 401 を返す。",
      security: [{ accessTokenCookie: [] }],
      responses: {
        200: {
          description: "認証済みユーザーの表示情報",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AuthMeResponseDto",
              },
            },
          },
        },
        401: {
          description: "未認証",
        },
        500: {
          description: "サーバーエラー",
        },
      },
    });

    expect(openApiDocument.paths["/auth/logout"]?.post).toMatchObject({
      tags: ["auth"],
      summary: "ログアウト",
      description:
        "BFF access token Cookie を削除する。サーバー側 session や token blacklist は作成しない。",
      responses: {
        204: {
          description: "ログアウト成功",
        },
        500: {
          description: "サーバーエラー",
        },
      },
    });
    expect(
      openApiDocument.paths["/auth/logout"]?.post?.responses[204],
    ).not.toHaveProperty("content");
  });

  it("publishes the display DTO and Cookie security scheme only", () => {
    expect(
      openApiDocument.components?.schemas?.AuthMeResponseDto,
    ).toMatchObject({
      type: "object",
      required: ["displayName"],
      properties: {
        displayName: {
          type: "string",
        },
        profileImageUrl: {
          type: "string",
          format: "uri",
          nullable: false,
        },
      },
    });
    expect(
      openApiDocument.components?.schemas?.AuthMeResponseDto,
    ).not.toHaveProperty("properties.email");
    expect(
      openApiDocument.components?.schemas?.AuthMeResponseDto,
    ).not.toHaveProperty("properties.subject");
    expect(
      openApiDocument.components?.securitySchemes?.accessTokenCookie,
    ).toEqual({
      type: "apiKey",
      in: "cookie",
      name: "access_token",
    });
    expect(
      Object.keys(openApiDocument.components?.schemas ?? {}).some((schema) =>
        schema.includes("Entity"),
      ),
    ).toBe(false);
  });

  it("does not publish out-of-scope Auth endpoints", () => {
    expect(openApiDocument.paths["/auth/google/login"]?.post).toBeUndefined();
    expect(openApiDocument.paths["/auth/refresh"]).toBeUndefined();
  });

  afterEach(async () => {
    await app?.close();
  });
});
