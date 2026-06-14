import type { INestApplication } from "@nestjs/common";
import type { OpenAPIObject } from "@nestjs/swagger";
import { Test, type TestingModule } from "@nestjs/testing";
import request from "supertest";
import type { App } from "supertest/types";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/bootstrap";
import { AppConfigService } from "../src/common/config/app-config.service";
import { GoogleOAuthRejectedException } from "../src/resources/auth/google-oauth-rejected.exception";
import { GoogleOAuthResource } from "../src/resources/auth/google-oauth.resource";

describe("Auth API (e2e)", () => {
  let app: INestApplication<App>;
  let openApiDocument: OpenAPIObject;
  let googleOAuthResource: {
    buildAuthorizationUrl: jest.Mock;
    exchangeAuthorizationCode: jest.Mock;
    getUserInfo: jest.Mock;
  };

  const config = {
    nodeEnv: "test",
    port: 3001,
    corsOrigins: ["http://localhost:3000"],
    logLevel: "silent",
    userApiBaseUrl: null,
    googleOAuthClientId: "google-client",
    googleOAuthClientSecret: "google-secret",
    googleOAuthRedirectUri:
      "http://localhost:3001/auth/google/callback",
    authSuccessRedirectUrl: "http://localhost:3000/auth/success",
    authFailureRedirectUrl: "http://localhost:3000/auth/failure",
    oauthStateSigningSecret: Buffer.alloc(32, 1).toString("base64url"),
    oauthStateTtlSeconds: 600,
    jwtAccessSecret: Buffer.alloc(32, 2).toString("base64url"),
    jwtAccessTtlSeconds: 3600,
    jwtIssuer: "bff-test",
    jwtAudience: "frontend-test",
    subjectDerivationSecret: Buffer.alloc(32, 3).toString("base64url"),
    googleOAuthTimeoutMs: 5000,
  } as AppConfigService;

  const cookiePair = (
    setCookies: string | string[] | undefined,
    name: string,
  ): string => {
    const values =
      typeof setCookies === "string" ? [setCookies] : setCookies;
    const cookie = values?.find((value) =>
      value.startsWith(`${name}=`),
    );
    if (cookie === undefined) {
      throw new Error(`${name} Cookie was not set`);
    }
    return cookie.split(";")[0];
  };

  const beginLogin = async () => {
    const response = await request(app.getHttpServer())
      .get("/auth/google/login")
      .expect(302);
    const location = new URL(response.headers.location);
    return {
      response,
      state: location.searchParams.get("state") ?? "",
      stateCookie: cookiePair(
        response.headers["set-cookie"],
        "google_oauth_state",
      ),
    };
  };

  beforeEach(async () => {
    googleOAuthResource = {
      buildAuthorizationUrl: jest.fn(({ state, codeChallenge }) => {
        const url = new URL(
          "https://accounts.google.com/o/oauth2/v2/auth",
        );
        url.search = new URLSearchParams({
          client_id: "google-client",
          redirect_uri:
            "http://localhost:3001/auth/google/callback",
          response_type: "code",
          scope: "openid profile email",
          state,
          code_challenge: codeChallenge,
          code_challenge_method: "S256",
        }).toString();
        return { authorizationUrl: url.toString() };
      }),
      exchangeAuthorizationCode: jest.fn().mockResolvedValue({
        accessToken: "google-access-token",
      }),
      getUserInfo: jest.fn().mockResolvedValue({
        providerUserId: "google-user-123",
        displayName: "Sample User",
        profileImageUrl: "https://example.com/profile.jpg",
      }),
    };
    const moduleFixture: TestingModule =
      await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider(AppConfigService)
        .useValue(config)
        .overrideProvider(GoogleOAuthResource)
        .useValue(googleOAuthResource)
        .compile();

    app = moduleFixture.createNestApplication();
    openApiDocument = configureApp(app);
    await app.init();
  });

  it("generates fresh signed state and PKCE values for every login", async () => {
    const first = await beginLogin();
    const second = await beginLogin();

    expect(first.state).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(second.state).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(first.state).not.toBe(second.state);
    expect(first.stateCookie).not.toBe(second.stateCookie);
    expect(first.response.headers["set-cookie"]).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Max-Age=600"),
        expect.stringContaining("HttpOnly"),
        expect.stringContaining("SameSite=Lax"),
      ]),
    );
    expect(
      new URL(first.response.headers.location).searchParams.get(
        "code_challenge",
      ),
    ).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("completes callback and returns display-only data from the JWT", async () => {
    const login = await beginLogin();
    const callback = await request(app.getHttpServer())
      .get("/auth/google/callback")
      .set("Cookie", login.stateCookie)
      .query({ code: "authorization-code", state: login.state })
      .expect(302);

    expect(callback.headers.location).toBe(
      "http://localhost:3000/auth/success",
    );
    expect(callback.headers["set-cookie"]).toEqual(
      expect.arrayContaining([
        expect.stringContaining("access_token="),
        expect.stringContaining("Max-Age=3600"),
        expect.stringMatching(
          /^google_oauth_state=; Path=\/; Expires=/,
        ),
      ]),
    );
    expect(
      googleOAuthResource.exchangeAuthorizationCode,
    ).toHaveBeenCalledTimes(1);
    expect(googleOAuthResource.getUserInfo).toHaveBeenCalledTimes(1);

    const accessCookie = cookiePair(
      callback.headers["set-cookie"],
      "access_token",
    );
    const me = await request(app.getHttpServer())
      .get("/auth/me")
      .set("Cookie", accessCookie)
      .expect(200);
    expect(me.body).toEqual({
      displayName: "Sample User",
      profileImageUrl: "https://example.com/profile.jpg",
    });
    expect(me.body).not.toHaveProperty("email");
    expect(me.body).not.toHaveProperty("subject");
  });

  it("omits profileImageUrl when Google UserInfo has no picture", async () => {
    googleOAuthResource.getUserInfo.mockResolvedValue({
      providerUserId: "google-user-123",
      displayName: "Sample User",
    });
    const login = await beginLogin();
    const callback = await request(app.getHttpServer())
      .get("/auth/google/callback")
      .set("Cookie", login.stateCookie)
      .query({ code: "authorization-code", state: login.state })
      .expect(302);
    const accessCookie = cookiePair(
      callback.headers["set-cookie"],
      "access_token",
    );

    const me = await request(app.getHttpServer())
      .get("/auth/me")
      .set("Cookie", accessCookie)
      .expect(200);
    expect(me.body).toEqual({ displayName: "Sample User" });
    expect(me.body).not.toHaveProperty("profileImageUrl");
  });

  it.each([undefined, ""])(
    "redirects to failure when Google UserInfo name is %p",
    async (displayName) => {
      googleOAuthResource.getUserInfo.mockResolvedValue({
        providerUserId: "google-user-123",
        ...(displayName === undefined ? {} : { displayName }),
        email: "private@example.com",
      });
      const login = await beginLogin();

      const callback = await request(app.getHttpServer())
        .get("/auth/google/callback")
        .set("Cookie", login.stateCookie)
        .query({ code: "authorization-code", state: login.state })
        .expect(302);

      expect(callback.headers.location).toBe(
        "http://localhost:3000/auth/failure",
      );
      expect(callback.headers["set-cookie"]).not.toEqual(
        expect.arrayContaining([
          expect.stringContaining("access_token="),
        ]),
      );
    },
  );

  it("validates state then redirects Provider errors without details", async () => {
    const login = await beginLogin();
    const response = await request(app.getHttpServer())
      .get("/auth/google/callback")
      .set("Cookie", login.stateCookie)
      .query({ error: "access_denied", state: login.state })
      .expect(302);

    expect(response.headers.location).toBe(
      "http://localhost:3000/auth/failure",
    );
    expect(response.headers.location).not.toContain("access_denied");
    expect(
      googleOAuthResource.exchangeAuthorizationCode,
    ).not.toHaveBeenCalled();
    expect(response.headers["set-cookie"]).toEqual(
      expect.arrayContaining([
        expect.stringMatching(
          /^google_oauth_state=; Path=\/; Expires=/,
        ),
      ]),
    );
  });

  it("maps a known token rejection to the failure redirect", async () => {
    googleOAuthResource.exchangeAuthorizationCode.mockRejectedValue(
      new GoogleOAuthRejectedException(),
    );
    const login = await beginLogin();
    const response = await request(app.getHttpServer())
      .get("/auth/google/callback")
      .set("Cookie", login.stateCookie)
      .query({ code: "rejected-code", state: login.state })
      .expect(302);

    expect(response.headers.location).toBe(
      "http://localhost:3000/auth/failure",
    );
    expect(googleOAuthResource.getUserInfo).not.toHaveBeenCalled();
    expect(response.headers["set-cookie"]).toEqual(
      expect.arrayContaining([
        expect.stringMatching(
          /^google_oauth_state=; Path=\/; Expires=/,
        ),
      ]),
    );
  });

  it("rejects a tampered state Cookie and clears it", async () => {
    const login = await beginLogin();
    const [cookieName, cookieValue] = login.stateCookie.split("=");
    const [payload, signature] = cookieValue.split(".");
    const replacement = signature.startsWith("A") ? "B" : "A";
    const tampered = `${cookieName}=${payload}.${replacement}${signature.slice(1)}`;
    const response = await request(app.getHttpServer())
      .get("/auth/google/callback")
      .set("Cookie", tampered)
      .query({ code: "code", state: login.state })
      .expect(400);

    expect(
      googleOAuthResource.exchangeAuthorizationCode,
    ).not.toHaveBeenCalled();
    expect(response.headers["set-cookie"]).toEqual(
      expect.arrayContaining([
        expect.stringMatching(
          /^google_oauth_state=; Path=\/; Expires=/,
        ),
      ]),
    );
  });

  it("returns 401 without redirect for a missing or invalid access Cookie", async () => {
    const missing = await request(app.getHttpServer())
      .get("/auth/me")
      .expect(401);
    const invalid = await request(app.getHttpServer())
      .get("/auth/me")
      .set("Cookie", "access_token=invalid")
      .expect(401);

    expect(missing.headers.location).toBeUndefined();
    expect(invalid.headers.location).toBeUndefined();
  });

  it.each([
    ["missing state", { code: "code" }],
    [
      "code and error together",
      { code: "code", error: "access_denied", state: "state" },
    ],
    ["neither code nor error", { state: "state" }],
  ])("rejects callback query with %s", async (_name, query) => {
    await request(app.getHttpServer())
      .get("/auth/google/callback")
      .query(query)
      .expect(400);
    expect(
      googleOAuthResource.exchangeAuthorizationCode,
    ).not.toHaveBeenCalled();
  });

  it("clears access Cookie idempotently with no response body", async () => {
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

  it("publishes the complete unchanged Auth contract in OpenAPI", () => {
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
        302: { description: "Google 認可画面へリダイレクト" },
        500: { description: "サーバーエラー" },
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
        expect.objectContaining({ name: "code", required: false }),
        expect.objectContaining({ name: "state", required: true }),
        expect.objectContaining({ name: "error", required: false }),
      ]),
      responses: {
        302: { description: "Frontend へリダイレクト" },
        400: { description: "不正な callback query" },
        500: { description: "サーバーエラー" },
      },
    });
    expect(openApiDocument.paths["/auth/me"]?.get).toMatchObject({
      tags: ["auth"],
      summary: "認証ユーザー取得",
      security: [{ accessTokenCookie: [] }],
      responses: {
        200: { description: "認証済みユーザーの表示情報" },
        401: { description: "未認証" },
        500: { description: "サーバーエラー" },
      },
    });
    expect(openApiDocument.paths["/auth/logout"]?.post).toMatchObject({
      tags: ["auth"],
      summary: "ログアウト",
      responses: {
        204: { description: "ログアウト成功" },
        500: { description: "サーバーエラー" },
      },
    });
  });

  it("publishes only the DTO and Cookie security scheme", () => {
    expect(
      openApiDocument.components?.schemas?.AuthMeResponseDto,
    ).toMatchObject({
      type: "object",
      required: ["displayName"],
      properties: {
        displayName: { type: "string" },
        profileImageUrl: {
          type: "string",
          format: "uri",
          nullable: false,
        },
      },
    });
    expect(
      openApiDocument.components?.securitySchemes?.accessTokenCookie,
    ).toEqual({
      type: "apiKey",
      in: "cookie",
      name: "access_token",
    });
    expect(
      Object.keys(openApiDocument.components?.schemas ?? {}).some(
        (schema) =>
          schema.includes("Entity") ||
          schema.includes("CurrentUser") ||
          schema.includes("Jwt"),
      ),
    ).toBe(false);
    expect(openApiDocument.paths["/auth/refresh"]).toBeUndefined();
    expect(
      openApiDocument.paths["/auth/google/login"]?.post,
    ).toBeUndefined();
  });

  afterEach(async () => {
    await app?.close();
  });
});
