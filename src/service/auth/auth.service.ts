import { BadRequestException, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AppConfigService } from "../../common/config/app-config.service";
import { AuthConfigurationException } from "../../common/error/auth-configuration.exception";
import { ResourceAccessException } from "../../common/error/resource-access.exception";
import { AuthMeResponseDto } from "../../dto/auth/auth-me-response.dto";
import {
  GoogleAuthorizationEntityRequest,
  GoogleTokenExchangeEntityRequest,
  GoogleUserInfoEntityRequest,
} from "../../entity/auth-google-oauth.entity";
import type { CurrentUser } from "../../guard/current-user";
import type { VerifiedOAuthState } from "../../interface/auth/oauth-state";
import { GoogleOAuthRejectedException } from "../../resource/auth/google-oauth-rejected.exception";
import { GoogleOAuthResource } from "../../resource/auth/google-oauth.resource";
import {
  accessTokenCookieOptions,
  authCookieClearOptions,
  oauthStateCookieOptions,
} from "../../utility/auth/auth-cookie";
import {
  signAccessToken,
  verifyAccessToken,
} from "../../utility/auth/jwt-token";
import {
  createOAuthState,
  verifyOAuthState,
} from "../../utility/auth/oauth-state";
import { deriveOpaqueSubject } from "../../utility/auth/opaque-subject";
import { readCookie } from "../../utility/auth/cookie";

export interface BeginGoogleLoginResult {
  authorizationUrl: string;
  stateCookieValue: string;
}

export interface HandleGoogleCallbackRequest {
  code?: string;
  cookieHeader?: string;
  error?: string;
  state?: string;
}

export type HandleGoogleCallbackResult =
  | {
      kind: "success";
      accessToken: string;
      redirectUrl: string;
    }
  | {
      kind: "failure";
      redirectUrl: string;
    };

const requiredRedirect = (
  key: string,
  value: string | null,
): string => {
  if (value === null) {
    throw new AuthConfigurationException(key);
  }
  return value;
};

const isNonBlankString = (value: unknown): value is string =>
  typeof value === "string" && value.trim() !== "";

const isOptionalHttpUrl = (value: unknown): value is string | undefined => {
  if (value === undefined) {
    return true;
  }
  if (typeof value !== "string") {
    return false;
  }
  try {
    const url = new URL(value);
    return (
      ["http:", "https:"].includes(url.protocol) &&
      url.username === "" &&
      url.password === ""
    );
  } catch {
    return false;
  }
};

@Injectable()
export class AuthService {
  constructor(
    private readonly googleOAuthResource: GoogleOAuthResource,
    private readonly jwtService: JwtService,
    private readonly config: AppConfigService,
  ) {}

  async beginGoogleLogin(): Promise<BeginGoogleLoginResult> {
    const state = createOAuthState({
      signingSecret: this.requiredConfig(
        "OAUTH_STATE_SIGNING_SECRET",
        this.config.oauthStateSigningSecret,
      ),
      ttlSeconds: this.config.oauthStateTtlSeconds,
    });
    const authorization =
      this.googleOAuthResource.buildAuthorizationUrl(
        new GoogleAuthorizationEntityRequest({
          state: state.state,
          codeChallenge: state.codeChallenge,
        }),
      );

    return {
      authorizationUrl: authorization.authorizationUrl,
      stateCookieValue: state.cookieValue,
    };
  }

  async handleGoogleCallback(
    request: HandleGoogleCallbackRequest,
  ): Promise<HandleGoogleCallbackResult> {
    const hasState = isNonBlankString(request.state);
    const hasCode = isNonBlankString(request.code);
    const hasError = isNonBlankString(request.error);
    if (!hasState || hasCode === hasError) {
      throw new BadRequestException("Invalid OAuth callback query");
    }

    let state: VerifiedOAuthState;
    try {
      state = verifyOAuthState(
        readCookie(request.cookieHeader, "google_oauth_state") ?? "",
        request.state ?? "",
        {
          signingSecret: this.requiredConfig(
            "OAUTH_STATE_SIGNING_SECRET",
            this.config.oauthStateSigningSecret,
          ),
          ttlSeconds: this.config.oauthStateTtlSeconds,
        },
      );
    } catch (error) {
      if (error instanceof AuthConfigurationException) {
        throw error;
      }
      throw new BadRequestException("Invalid OAuth state");
    }
    const failureRedirectUrl = requiredRedirect(
      "AUTH_FAILURE_REDIRECT_URL",
      this.config.authFailureRedirectUrl,
    );
    if (hasError) {
      return { kind: "failure", redirectUrl: failureRedirectUrl };
    }

    try {
      const token =
        await this.googleOAuthResource.exchangeAuthorizationCode(
          new GoogleTokenExchangeEntityRequest({
            code: request.code ?? "",
            codeVerifier: state.codeVerifier,
          }),
        );
      const userInfo = await this.googleOAuthResource.getUserInfo(
        new GoogleUserInfoEntityRequest({
          accessToken: token.accessToken,
        }),
      );
      if (
        !isNonBlankString(userInfo.providerUserId) ||
        !isNonBlankString(userInfo.displayName) ||
        !isOptionalHttpUrl(userInfo.profileImageUrl)
      ) {
        return { kind: "failure", redirectUrl: failureRedirectUrl };
      }
      const currentUser: CurrentUser = {
        subject: deriveOpaqueSubject(
          "google",
          userInfo.providerUserId,
          this.requiredConfig(
            "SUBJECT_DERIVATION_SECRET",
            this.config.subjectDerivationSecret,
          ),
        ),
        displayName: userInfo.displayName,
        ...(userInfo.profileImageUrl === undefined
          ? {}
          : { profileImageUrl: userInfo.profileImageUrl }),
      };
      const accessToken = await signAccessToken(
        this.jwtService,
        currentUser,
        this.jwtConfig(),
      );

      return {
        kind: "success",
        accessToken,
        redirectUrl: requiredRedirect(
          "AUTH_SUCCESS_REDIRECT_URL",
          this.config.authSuccessRedirectUrl,
        ),
      };
    } catch (error) {
      if (
        error instanceof GoogleOAuthRejectedException ||
        error instanceof ResourceAccessException
      ) {
        return { kind: "failure", redirectUrl: failureRedirectUrl };
      }
      throw error;
    }
  }

  getMe(currentUser: CurrentUser): AuthMeResponseDto {
    return new AuthMeResponseDto({
      displayName: currentUser.displayName,
      ...(currentUser.profileImageUrl === undefined
        ? {}
        : { profileImageUrl: currentUser.profileImageUrl }),
    });
  }

  verifyAccessToken(token: string): Promise<CurrentUser> {
    return verifyAccessToken(this.jwtService, token, this.jwtConfig());
  }

  oauthStateCookieOptions() {
    return oauthStateCookieOptions(this.config);
  }

  accessTokenCookieOptions() {
    return accessTokenCookieOptions(this.config);
  }

  cookieClearOptions() {
    return authCookieClearOptions(this.config);
  }

  private jwtConfig() {
    return {
      secret: this.requiredConfig(
        "JWT_ACCESS_SECRET",
        this.config.jwtAccessSecret,
      ),
      ttlSeconds: this.config.jwtAccessTtlSeconds,
      issuer: this.requiredConfig("JWT_ISSUER", this.config.jwtIssuer),
      audience: this.requiredConfig(
        "JWT_AUDIENCE",
        this.config.jwtAudience,
      ),
    };
  }

  private requiredConfig(key: string, value: string | null): string {
    if (value === null) {
      throw new AuthConfigurationException(key);
    }
    return value;
  }
}
