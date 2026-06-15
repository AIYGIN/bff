import { BadRequestException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AppConfigService } from "../../common/config/app-config.service";
import { ResourceAccessException } from "../../common/error/resource-access.exception";
import { GoogleOAuthRejectedException } from "../../resource/auth/google-oauth-rejected.exception";
import { GoogleOAuthResource } from "../../resource/auth/google-oauth.resource";
import { createOAuthState } from "../../utility/auth/oauth-state";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  const createService = () => {
    const googleOAuthResource = {
      buildAuthorizationUrl: jest.fn(),
      exchangeAuthorizationCode: jest.fn(),
      getUserInfo: jest.fn(),
    } as unknown as jest.Mocked<GoogleOAuthResource>;
    const jwtService = {
      signAsync: jest.fn().mockResolvedValue("bff-jwt"),
      verifyAsync: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;
    const config = {
      authFailureRedirectUrl:
        "https://frontend.example.com/auth/failure",
      authSuccessRedirectUrl:
        "https://frontend.example.com/auth/success",
      jwtAccessSecret: Buffer.alloc(32, 2).toString("base64url"),
      jwtAccessTtlSeconds: 3600,
      jwtAudience: "frontend",
      jwtIssuer: "bff",
      nodeEnv: "test",
      oauthStateSigningSecret: Buffer.alloc(32, 1).toString("base64url"),
      oauthStateTtlSeconds: 600,
      subjectDerivationSecret: Buffer.alloc(32, 3).toString("base64url"),
    } as AppConfigService;

    return {
      config,
      googleOAuthResource,
      jwtService,
      service: new AuthService(
        googleOAuthResource,
        jwtService,
        config,
      ),
    };
  };

  const callbackState = (config: AppConfigService) =>
    createOAuthState({
      signingSecret: config.oauthStateSigningSecret ?? "",
      ttlSeconds: config.oauthStateTtlSeconds,
    });

  it("orchestrates state creation and authorization URL building", async () => {
    const { googleOAuthResource, service } = createService();
    googleOAuthResource.buildAuthorizationUrl.mockReturnValue({
      authorizationUrl: "https://accounts.google.com/auth",
    });

    await expect(service.beginGoogleLogin()).resolves.toMatchObject({
      authorizationUrl: "https://accounts.google.com/auth",
      stateCookieValue: expect.any(String),
    });
    expect(
      googleOAuthResource.buildAuthorizationUrl,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        state: expect.stringMatching(/^[A-Za-z0-9_-]{43}$/),
        codeChallenge: expect.stringMatching(/^[A-Za-z0-9_-]{43}$/),
      }),
    );
  });

  it("validates state before exchanging an authorization code", async () => {
    const { googleOAuthResource, service } = createService();

    await expect(
      service.handleGoogleCallback({
        code: "code",
        cookieHeader: "google_oauth_state=invalid",
        state: "invalid",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(
      googleOAuthResource.exchangeAuthorizationCode,
    ).not.toHaveBeenCalled();
  });

  it("returns failure without Provider calls for a callback error", async () => {
    const { config, googleOAuthResource, service } = createService();
    const state = callbackState(config);

    await expect(
      service.handleGoogleCallback({
        error: "access_denied",
        cookieHeader: `google_oauth_state=${state.cookieValue}`,
        state: state.state,
      }),
    ).resolves.toEqual({
      kind: "failure",
      redirectUrl: "https://frontend.example.com/auth/failure",
    });
    expect(
      googleOAuthResource.exchangeAuthorizationCode,
    ).not.toHaveBeenCalled();
    expect(googleOAuthResource.getUserInfo).not.toHaveBeenCalled();
  });

  it("exchanges code, loads UserInfo, derives subject, and signs JWT", async () => {
    const {
      config,
      googleOAuthResource,
      jwtService,
      service,
    } = createService();
    const state = callbackState(config);
    googleOAuthResource.exchangeAuthorizationCode.mockResolvedValue({
      accessToken: "google-token",
    });
    googleOAuthResource.getUserInfo.mockResolvedValue({
      providerUserId: "google-user",
      displayName: "Sample User",
    });
    await expect(
      service.handleGoogleCallback({
        code: "code",
        cookieHeader: `google_oauth_state=${state.cookieValue}`,
        state: state.state,
      }),
    ).resolves.toEqual({
      kind: "success",
      accessToken: "bff-jwt",
      redirectUrl: "https://frontend.example.com/auth/success",
    });
    expect(
      googleOAuthResource.exchangeAuthorizationCode,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "code",
        codeVerifier: expect.stringMatching(/^[A-Za-z0-9_-]{43}$/),
      }),
    );
    expect(googleOAuthResource.getUserInfo).toHaveBeenCalledWith({
      accessToken: "google-token",
    });
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      {
        displayName: "Sample User",
      },
      expect.objectContaining({
        algorithm: "HS256",
        subject: expect.stringMatching(/^usr_v1_[A-Za-z0-9_-]{43}$/),
      }),
    );
    expect(
      googleOAuthResource.exchangeAuthorizationCode.mock
        .invocationCallOrder[0],
    ).toBeLessThan(
      googleOAuthResource.getUserInfo.mock.invocationCallOrder[0],
    );
    expect(
      googleOAuthResource.getUserInfo.mock.invocationCallOrder[0],
    ).toBeLessThan(
      jwtService.signAsync.mock.invocationCallOrder[0],
    );
  });

  it.each([
    [
      "missing Provider user ID",
      { providerUserId: "", displayName: "Sample User" },
    ],
    [
      "missing display name",
      { providerUserId: "google-user", displayName: "" },
    ],
  ])("maps %s to authentication failure", async (_name, userInfo) => {
    const {
      config,
      googleOAuthResource,
      jwtService,
      service,
    } = createService();
    const state = callbackState(config);
    googleOAuthResource.exchangeAuthorizationCode.mockResolvedValue({
      accessToken: "google-token",
    });
    googleOAuthResource.getUserInfo.mockResolvedValue(userInfo);
    await expect(
      service.handleGoogleCallback({
        code: "code",
        cookieHeader: `google_oauth_state=${state.cookieValue}`,
        state: state.state,
      }),
    ).resolves.toEqual({
      kind: "failure",
      redirectUrl: "https://frontend.example.com/auth/failure",
    });
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it.each([
    ["blank code", { code: " ", state: "state" }],
    ["blank error", { error: " ", state: "state" }],
  ])("rejects %s before state or Provider processing", async (_name, request) => {
    const { googleOAuthResource, service } = createService();

    await expect(
      service.handleGoogleCallback({
        ...request,
        cookieHeader: "google_oauth_state=signed",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(
      googleOAuthResource.exchangeAuthorizationCode,
    ).not.toHaveBeenCalled();
    expect(googleOAuthResource.getUserInfo).not.toHaveBeenCalled();
  });

  it.each([
    new GoogleOAuthRejectedException(),
    new ResourceAccessException("Google OAuth"),
  ])("maps known Provider failure to a detail-free redirect", async (error) => {
    const { config, googleOAuthResource, service } = createService();
    const state = callbackState(config);
    googleOAuthResource.exchangeAuthorizationCode.mockRejectedValue(error);

    await expect(
      service.handleGoogleCallback({
        code: "code",
        cookieHeader: `google_oauth_state=${state.cookieValue}`,
        state: state.state,
      }),
    ).resolves.toEqual({
      kind: "failure",
      redirectUrl: "https://frontend.example.com/auth/failure",
    });
  });

  it("returns display-only DTO and omits absent image", () => {
    const { service } = createService();
    const response = service.getMe({
      subject: "usr_v1_opaque",
      displayName: "Sample User",
    });

    expect(JSON.parse(JSON.stringify(response))).toEqual({
      displayName: "Sample User",
    });
    expect(response).not.toHaveProperty("subject");
    expect(response).not.toHaveProperty("email");
  });

  it("returns an optional non-null profile image without identifiers", () => {
    const { service } = createService();

    expect(
      service.getMe({
        subject: "usr_v1_opaque",
        displayName: "Sample User",
        profileImageUrl: "https://example.com/profile.jpg",
      }),
    ).toEqual({
      displayName: "Sample User",
      profileImageUrl: "https://example.com/profile.jpg",
    });
  });
});
