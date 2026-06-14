import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { isAxiosError } from "axios";
import { firstValueFrom } from "rxjs";
import { AppConfigService } from "../../common/config/app-config.service";
import {
  AppLogger,
  type ContextLogger,
} from "../../common/logging/app-logger.service";
import {
  GoogleAuthorizationEntityRequest,
  GoogleAuthorizationEntityResponse,
  GoogleTokenEntityResponse,
  GoogleTokenExchangeEntityRequest,
  GoogleUserInfoEntityRequest,
  GoogleUserInfoEntityResponse,
} from "../../interface/entity/auth/google-oauth.entity";
import { AuthConfigurationException } from "../../lib/errors/auth-configuration.exception";
import { ResourceAccessException } from "../../lib/errors/resource-access.exception";
import { GoogleOAuthRejectedException } from "./google-oauth-rejected.exception";

const GOOGLE_AUTHORIZATION_ENDPOINT =
  "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_USER_INFO_ENDPOINT =
  "https://openidconnect.googleapis.com/v1/userinfo";

interface GoogleTokenResponse {
  access_token?: unknown;
}

interface GoogleUserInfoResponse {
  sub?: unknown;
  name?: unknown;
  picture?: unknown;
}

const requiredConfig = (
  key: string,
  value: string | null,
): string => {
  if (value === null) {
    throw new AuthConfigurationException(key);
  }
  return value;
};

const nonEmptyString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() !== ""
    ? value.trim()
    : null;

const optionalHttpUrl = (value: unknown): string | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }
  const normalized = nonEmptyString(value);
  if (normalized === null) {
    throw new GoogleOAuthRejectedException();
  }
  try {
    const url = new URL(normalized);
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("invalid protocol");
    }
    return url.toString();
  } catch (error) {
    throw new GoogleOAuthRejectedException({ cause: error });
  }
};

@Injectable()
export class GoogleOAuthResource {
  private readonly logger: ContextLogger;

  constructor(
    private readonly httpService: HttpService,
    private readonly config: AppConfigService,
    appLogger: AppLogger,
  ) {
    this.logger = appLogger.withContext(GoogleOAuthResource.name);
  }

  buildAuthorizationUrl(
    request: GoogleAuthorizationEntityRequest,
  ): GoogleAuthorizationEntityResponse {
    const url = new URL(GOOGLE_AUTHORIZATION_ENDPOINT);
    url.search = new URLSearchParams({
      client_id: requiredConfig(
        "GOOGLE_OAUTH_CLIENT_ID",
        this.config.googleOAuthClientId,
      ),
      redirect_uri: requiredConfig(
        "GOOGLE_OAUTH_REDIRECT_URI",
        this.config.googleOAuthRedirectUri,
      ),
      response_type: "code",
      scope: "openid profile email",
      state: request.state,
      code_challenge: request.codeChallenge,
      code_challenge_method: "S256",
    }).toString();

    return new GoogleAuthorizationEntityResponse({
      authorizationUrl: url.toString(),
    });
  }

  async exchangeAuthorizationCode(
    request: GoogleTokenExchangeEntityRequest,
  ): Promise<GoogleTokenEntityResponse> {
    const body = new URLSearchParams({
      code: request.code,
      client_id: requiredConfig(
        "GOOGLE_OAUTH_CLIENT_ID",
        this.config.googleOAuthClientId,
      ),
      client_secret: requiredConfig(
        "GOOGLE_OAUTH_CLIENT_SECRET",
        this.config.googleOAuthClientSecret,
      ),
      redirect_uri: requiredConfig(
        "GOOGLE_OAUTH_REDIRECT_URI",
        this.config.googleOAuthRedirectUri,
      ),
      grant_type: "authorization_code",
      code_verifier: request.codeVerifier,
    });

    try {
      this.logger.debug("requesting Google OAuth token", {
        provider: "google",
        operation: "token",
      });
      const response = await firstValueFrom(
        this.httpService.post<GoogleTokenResponse>(
          GOOGLE_TOKEN_ENDPOINT,
          body,
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            timeout: this.config.googleOAuthTimeoutMs,
            maxRedirects: 0,
          },
        ),
      );
      const accessToken = nonEmptyString(response.data.access_token);
      if (accessToken === null) {
        throw new GoogleOAuthRejectedException();
      }

      return new GoogleTokenEntityResponse({ accessToken });
    } catch (error) {
      this.mapError(error, "token");
    }
  }

  async getUserInfo(
    request: GoogleUserInfoEntityRequest,
  ): Promise<GoogleUserInfoEntityResponse> {
    try {
      this.logger.debug("requesting Google UserInfo", {
        provider: "google",
        operation: "userinfo",
      });
      const response = await firstValueFrom(
        this.httpService.get<GoogleUserInfoResponse>(
          GOOGLE_USER_INFO_ENDPOINT,
          {
            headers: {
              Authorization: `Bearer ${request.accessToken}`,
            },
            timeout: this.config.googleOAuthTimeoutMs,
            maxRedirects: 0,
          },
        ),
      );
      const providerUserId = nonEmptyString(response.data.sub);
      const displayName = nonEmptyString(response.data.name);
      if (providerUserId === null || displayName === null) {
        throw new GoogleOAuthRejectedException();
      }
      const profileImageUrl = optionalHttpUrl(response.data.picture);

      return new GoogleUserInfoEntityResponse({
        providerUserId,
        displayName,
        ...(profileImageUrl === undefined ? {} : { profileImageUrl }),
      });
    } catch (error) {
      this.mapError(error, "userinfo");
    }
  }

  private mapError(error: unknown, operation: string): never {
    if (error instanceof GoogleOAuthRejectedException) {
      throw error;
    }
    if (isAxiosError(error)) {
      const status = error.response?.status;
      this.logger.warn("Google OAuth request failed", {
        provider: "google",
        operation,
        statusCategory:
          status === undefined ? "network" : `${Math.floor(status / 100)}xx`,
      });
      if (status !== undefined && [400, 401, 403].includes(status)) {
        throw new GoogleOAuthRejectedException({ cause: error });
      }
      throw new ResourceAccessException("Google OAuth", {
        cause: error,
      });
    }

    throw error;
  }
}
