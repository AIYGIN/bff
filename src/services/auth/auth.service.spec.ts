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
});
