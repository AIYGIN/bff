import { BadRequestException } from "@nestjs/common";
import { AppConfigService } from "../../common/config/app-config.service";
import { ResourceAccessException } from "../../lib/errors/resource-access.exception";
import { GoogleOAuthRejectedException } from "../../resources/auth/google-oauth-rejected.exception";
import { GoogleOAuthResource } from "../../resources/auth/google-oauth.resource";
import { AuthService } from "./auth.service";
import { JwtTokenService } from "./jwt-token.service";
import { OAuthStateService } from "./oauth-state.service";
import { OpaqueSubjectService } from "./opaque-subject.service";

describe("AuthService", () => {
  const createService = () => {
    const oauthStateService = {
      create: jest.fn(),
      verify: jest.fn(),
    } as unknown as jest.Mocked<OAuthStateService>;
    const googleOAuthResource = {
      buildAuthorizationUrl: jest.fn(),
      exchangeAuthorizationCode: jest.fn(),
      getUserInfo: jest.fn(),
    } as unknown as jest.Mocked<GoogleOAuthResource>;
    const opaqueSubjectService = {
      derive: jest.fn(),
    } as unknown as jest.Mocked<OpaqueSubjectService>;
    const jwtTokenService = {
      signAccessToken: jest.fn(),
    } as unknown as jest.Mocked<JwtTokenService>;
    const config = {
      authFailureRedirectUrl:
        "https://frontend.example.com/auth/failure",
      authSuccessRedirectUrl:
        "https://frontend.example.com/auth/success",
    } as AppConfigService;

    return {
      googleOAuthResource,
      jwtTokenService,
      oauthStateService,
      opaqueSubjectService,
      service: new AuthService(
        googleOAuthResource,
        oauthStateService,
        opaqueSubjectService,
        jwtTokenService,
        config,
      ),
    };
  };

  it("orchestrates state creation and authorization URL building", async () => {
    const { googleOAuthResource, oauthStateService, service } =
      createService();
    oauthStateService.create.mockReturnValue({
      state: "state",
      codeChallenge: "challenge",
      cookieValue: "signed-state",
    });
    googleOAuthResource.buildAuthorizationUrl.mockReturnValue({
      authorizationUrl: "https://accounts.google.com/auth",
    });

    await expect(service.beginGoogleLogin()).resolves.toEqual({
      stateCookieValue: "signed-state",
      authorizationUrl: "https://accounts.google.com/auth",
    });
    expect(googleOAuthResource.buildAuthorizationUrl).toHaveBeenCalledWith({
      state: "state",
      codeChallenge: "challenge",
    });
  });

  it("validates state before exchanging an authorization code", async () => {
    const { googleOAuthResource, oauthStateService, service } =
      createService();
    oauthStateService.verify.mockImplementation(() => {
      throw new BadRequestException();
    });

    await expect(
      service.handleGoogleCallback({
        code: "code",
        state: "state",
        stateCookieValue: "signed",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(
      googleOAuthResource.exchangeAuthorizationCode,
    ).not.toHaveBeenCalled();
  });

  it("returns failure without Provider calls for a callback error", async () => {
    const { googleOAuthResource, oauthStateService, service } =
      createService();
    oauthStateService.verify.mockReturnValue({
      state: "state",
      codeVerifier: "verifier",
    });

    await expect(
      service.handleGoogleCallback({
        error: "access_denied",
        state: "state",
        stateCookieValue: "signed",
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
      googleOAuthResource,
      jwtTokenService,
      oauthStateService,
      opaqueSubjectService,
      service,
    } = createService();
    oauthStateService.verify.mockReturnValue({
      state: "state",
      codeVerifier: "verifier",
    });
    googleOAuthResource.exchangeAuthorizationCode.mockResolvedValue({
      accessToken: "google-token",
    });
    googleOAuthResource.getUserInfo.mockResolvedValue({
      providerUserId: "google-user",
      displayName: "Sample User",
    });
    opaqueSubjectService.derive.mockReturnValue("usr_v1_opaque");
    jwtTokenService.signAccessToken.mockResolvedValue("bff-jwt");

    await expect(
      service.handleGoogleCallback({
        code: "code",
        state: "state",
        stateCookieValue: "signed",
      }),
    ).resolves.toEqual({
      kind: "success",
      accessToken: "bff-jwt",
      redirectUrl: "https://frontend.example.com/auth/success",
    });
    expect(
      googleOAuthResource.exchangeAuthorizationCode,
    ).toHaveBeenCalledWith({
      code: "code",
      codeVerifier: "verifier",
    });
    expect(googleOAuthResource.getUserInfo).toHaveBeenCalledWith({
      accessToken: "google-token",
    });
    expect(opaqueSubjectService.derive).toHaveBeenCalledWith(
      "google",
      "google-user",
    );
    expect(jwtTokenService.signAccessToken).toHaveBeenCalledWith({
      subject: "usr_v1_opaque",
      displayName: "Sample User",
    });
    expect(
      googleOAuthResource.exchangeAuthorizationCode.mock
        .invocationCallOrder[0],
    ).toBeLessThan(
      googleOAuthResource.getUserInfo.mock.invocationCallOrder[0],
    );
    expect(
      googleOAuthResource.getUserInfo.mock.invocationCallOrder[0],
    ).toBeLessThan(
      opaqueSubjectService.derive.mock.invocationCallOrder[0],
    );
    expect(
      opaqueSubjectService.derive.mock.invocationCallOrder[0],
    ).toBeLessThan(
      jwtTokenService.signAccessToken.mock.invocationCallOrder[0],
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
      googleOAuthResource,
      jwtTokenService,
      oauthStateService,
      opaqueSubjectService,
      service,
    } = createService();
    oauthStateService.verify.mockReturnValue({
      state: "state",
      codeVerifier: "verifier",
    });
    googleOAuthResource.exchangeAuthorizationCode.mockResolvedValue({
      accessToken: "google-token",
    });
    googleOAuthResource.getUserInfo.mockResolvedValue(userInfo);
    opaqueSubjectService.derive.mockReturnValue("usr_v1_opaque");
    jwtTokenService.signAccessToken.mockResolvedValue("bff-jwt");

    await expect(
      service.handleGoogleCallback({
        code: "code",
        state: "state",
        stateCookieValue: "signed",
      }),
    ).resolves.toEqual({
      kind: "failure",
      redirectUrl: "https://frontend.example.com/auth/failure",
    });
    expect(opaqueSubjectService.derive).not.toHaveBeenCalled();
    expect(jwtTokenService.signAccessToken).not.toHaveBeenCalled();
  });

  it.each([
    ["blank code", { code: " ", state: "state" }],
    ["blank error", { error: " ", state: "state" }],
  ])("rejects %s before state or Provider processing", async (_name, request) => {
    const { googleOAuthResource, oauthStateService, service } =
      createService();

    await expect(
      service.handleGoogleCallback({
        ...request,
        stateCookieValue: "signed",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(oauthStateService.verify).not.toHaveBeenCalled();
    expect(
      googleOAuthResource.exchangeAuthorizationCode,
    ).not.toHaveBeenCalled();
    expect(googleOAuthResource.getUserInfo).not.toHaveBeenCalled();
  });

  it.each([
    new GoogleOAuthRejectedException(),
    new ResourceAccessException("Google OAuth"),
  ])("maps known Provider failure to a detail-free redirect", async (error) => {
    const { googleOAuthResource, oauthStateService, service } =
      createService();
    oauthStateService.verify.mockReturnValue({
      state: "state",
      codeVerifier: "verifier",
    });
    googleOAuthResource.exchangeAuthorizationCode.mockRejectedValue(error);

    await expect(
      service.handleGoogleCallback({
        code: "code",
        state: "state",
        stateCookieValue: "signed",
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
