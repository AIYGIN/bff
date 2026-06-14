import { BadRequestException, Injectable } from "@nestjs/common";
import type { CurrentUser } from "../../common/auth/current-user";
import { AppConfigService } from "../../common/config/app-config.service";
import { AuthMeResponseDto } from "../../interface/dto/auth/auth-me-response.dto";
import {
  GoogleAuthorizationEntityRequest,
  GoogleTokenExchangeEntityRequest,
  GoogleUserInfoEntityRequest,
} from "../../interface/entity/auth/google-oauth.entity";
import { AuthConfigurationException } from "../../lib/errors/auth-configuration.exception";
import { ResourceAccessException } from "../../lib/errors/resource-access.exception";
import { GoogleOAuthRejectedException } from "../../resources/auth/google-oauth-rejected.exception";
import { GoogleOAuthResource } from "../../resources/auth/google-oauth.resource";
import { JwtTokenService } from "./jwt-token.service";
import { OAuthStateService } from "./oauth-state.service";
import { OpaqueSubjectService } from "./opaque-subject.service";

export interface BeginGoogleLoginResult {
  authorizationUrl: string;
  stateCookieValue: string;
}

export interface HandleGoogleCallbackRequest {
  code?: string;
  error?: string;
  state?: string;
  stateCookieValue?: string;
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
    private readonly oauthStateService: OAuthStateService,
    private readonly opaqueSubjectService: OpaqueSubjectService,
    private readonly jwtTokenService: JwtTokenService,
    private readonly config: AppConfigService,
  ) {}

  async beginGoogleLogin(): Promise<BeginGoogleLoginResult> {
    const state = this.oauthStateService.create();
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

    const state = this.oauthStateService.verify(
      request.stateCookieValue ?? "",
      request.state ?? "",
    );
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
        subject: this.opaqueSubjectService.derive(
          "google",
          userInfo.providerUserId,
        ),
        displayName: userInfo.displayName,
        ...(userInfo.profileImageUrl === undefined
          ? {}
          : { profileImageUrl: userInfo.profileImageUrl }),
      };
      const accessToken =
        await this.jwtTokenService.signAccessToken(currentUser);

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
}
