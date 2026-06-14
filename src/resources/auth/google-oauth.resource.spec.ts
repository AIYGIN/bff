import { HttpService } from "@nestjs/axios";
import { AxiosError } from "axios";
import { of, throwError } from "rxjs";
import { AppConfigService } from "../../common/config/app-config.service";
import {
  AppLogger,
  type ContextLogger,
} from "../../common/logging/app-logger.service";
import { ResourceAccessException } from "../../lib/errors/resource-access.exception";
import { GoogleOAuthRejectedException } from "./google-oauth-rejected.exception";
import { GoogleOAuthResource } from "./google-oauth.resource";

describe("GoogleOAuthResource", () => {
  const config = {
    googleOAuthClientId: "google-client",
    googleOAuthClientSecret: "google-secret",
    googleOAuthRedirectUri:
      "https://bff.example.com/auth/google/callback",
    googleOAuthTimeoutMs: 5000,
  } as AppConfigService;
  const contextLogger: ContextLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  const appLogger = {
    withContext: jest.fn().mockReturnValue(contextLogger),
  } as unknown as AppLogger;

  it("builds the exact Google authorization request", () => {
    const resource = new GoogleOAuthResource(
      { get: jest.fn(), post: jest.fn() } as unknown as HttpService,
      config,
      appLogger,
    );

    const result = resource.buildAuthorizationUrl({
      state: "oauth-state",
      codeChallenge: "pkce-challenge",
    });
    const url = new URL(result.authorizationUrl);

    expect(url.origin + url.pathname).toBe(
      "https://accounts.google.com/o/oauth2/v2/auth",
    );
    expect(Object.fromEntries(url.searchParams)).toEqual({
      client_id: "google-client",
      redirect_uri: "https://bff.example.com/auth/google/callback",
      response_type: "code",
      scope: "openid profile email",
      state: "oauth-state",
      code_challenge: "pkce-challenge",
      code_challenge_method: "S256",
    });
    expect(url.searchParams.has("access_type")).toBe(false);
  });

  it("exchanges a code once using form encoding and no redirects", async () => {
    const post = jest.fn().mockReturnValue(
      of({
        data: {
          access_token: "google-access-token",
          id_token: "discarded",
          refresh_token: "discarded",
        },
      }),
    );
    const resource = new GoogleOAuthResource(
      { get: jest.fn(), post } as unknown as HttpService,
      config,
      appLogger,
    );

    await expect(
      resource.exchangeAuthorizationCode({
        code: "authorization-code",
        codeVerifier: "pkce-verifier",
      }),
    ).resolves.toEqual({ accessToken: "google-access-token" });
    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith(
      "https://oauth2.googleapis.com/token",
      expect.any(URLSearchParams),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        maxRedirects: 0,
        timeout: 5000,
      },
    );
    expect(post.mock.calls[0][1].toString()).toBe(
      "code=authorization-code&client_id=google-client&client_secret=google-secret&redirect_uri=https%3A%2F%2Fbff.example.com%2Fauth%2Fgoogle%2Fcallback&grant_type=authorization_code&code_verifier=pkce-verifier",
    );
  });

  it("gets UserInfo once and drops email and Provider details", async () => {
    const get = jest.fn().mockReturnValue(
      of({
        data: {
          sub: "google-user-123",
          name: "Sample User",
          picture: "https://example.com/profile.jpg",
          email: "private@example.com",
        },
      }),
    );
    const resource = new GoogleOAuthResource(
      { get, post: jest.fn() } as unknown as HttpService,
      config,
      appLogger,
    );

    await expect(
      resource.getUserInfo({ accessToken: "google-access-token" }),
    ).resolves.toEqual({
      providerUserId: "google-user-123",
      displayName: "Sample User",
      profileImageUrl: "https://example.com/profile.jpg",
    });
    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith(
      "https://openidconnect.googleapis.com/v1/userinfo",
      {
        headers: {
          Authorization: "Bearer google-access-token",
        },
        maxRedirects: 0,
        timeout: 5000,
      },
    );
  });

  it("rejects UserInfo without a display name", async () => {
    const resource = new GoogleOAuthResource(
      {
        get: jest.fn().mockReturnValue(
          of({
            data: {
              sub: "google-user-123",
              email: "private@example.com",
            },
          }),
        ),
        post: jest.fn(),
      } as unknown as HttpService,
      config,
      appLogger,
    );

    await expect(
      resource.getUserInfo({ accessToken: "token" }),
    ).rejects.toBeInstanceOf(GoogleOAuthRejectedException);
  });

  it.each([
    [400, GoogleOAuthRejectedException],
    [401, GoogleOAuthRejectedException],
    [403, GoogleOAuthRejectedException],
    [429, ResourceAccessException],
    [500, ResourceAccessException],
  ])("maps Provider status %s without retry", async (status, type) => {
    const error = new AxiosError(
      "provider details",
      "ERR_BAD_RESPONSE",
      undefined,
      undefined,
      { status, data: { access_token: "secret" } } as never,
    );
    const post = jest.fn().mockReturnValue(throwError(() => error));
    const resource = new GoogleOAuthResource(
      { get: jest.fn(), post } as unknown as HttpService,
      config,
      appLogger,
    );

    await expect(
      resource.exchangeAuthorizationCode({
        code: "code",
        codeVerifier: "verifier",
      }),
    ).rejects.toBeInstanceOf(type);
    expect(post).toHaveBeenCalledTimes(1);
  });
});
