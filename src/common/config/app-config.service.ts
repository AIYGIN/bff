import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type {
  AppEnvironment,
  EnvironmentVariables,
  LogLevel,
} from "./environment";

@Injectable()
export class AppConfigService {
  constructor(
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {}

  get nodeEnv(): AppEnvironment {
    return this.configService.get("NODE_ENV", { infer: true });
  }

  get port(): number {
    return this.configService.get("PORT", { infer: true });
  }

  get corsOrigins(): string[] {
    return this.configService.get("CORS_ORIGINS", { infer: true });
  }

  get logLevel(): LogLevel {
    return this.configService.get("LOG_LEVEL", { infer: true });
  }

  get googleOAuthClientId(): string | null {
    return this.configService.get("GOOGLE_OAUTH_CLIENT_ID", {
      infer: true,
    });
  }

  get googleOAuthClientSecret(): string | null {
    return this.configService.get("GOOGLE_OAUTH_CLIENT_SECRET", {
      infer: true,
    });
  }

  get googleOAuthRedirectUri(): string | null {
    return this.configService.get("GOOGLE_OAUTH_REDIRECT_URI", {
      infer: true,
    });
  }

  get authSuccessRedirectUrl(): string | null {
    return this.configService.get("AUTH_SUCCESS_REDIRECT_URL", {
      infer: true,
    });
  }

  get authFailureRedirectUrl(): string | null {
    return this.configService.get("AUTH_FAILURE_REDIRECT_URL", {
      infer: true,
    });
  }

  get oauthStateSigningSecret(): string | null {
    return this.configService.get("OAUTH_STATE_SIGNING_SECRET", {
      infer: true,
    });
  }

  get oauthStateTtlSeconds(): number {
    return this.configService.get("OAUTH_STATE_TTL_SECONDS", {
      infer: true,
    });
  }

  get jwtAccessSecret(): string | null {
    return this.configService.get("JWT_ACCESS_SECRET", { infer: true });
  }

  get jwtAccessTtlSeconds(): number {
    return this.configService.get("JWT_ACCESS_TTL_SECONDS", {
      infer: true,
    });
  }

  get jwtIssuer(): string | null {
    return this.configService.get("JWT_ISSUER", { infer: true });
  }

  get jwtAudience(): string | null {
    return this.configService.get("JWT_AUDIENCE", { infer: true });
  }

  get subjectDerivationSecret(): string | null {
    return this.configService.get("SUBJECT_DERIVATION_SECRET", {
      infer: true,
    });
  }

  get googleOAuthTimeoutMs(): number {
    return this.configService.get("GOOGLE_OAUTH_TIMEOUT_MS", {
      infer: true,
    });
  }

  get supabaseUrl(): string | null {
    return this.configService.get("SUPABASE_URL", { infer: true });
  }

  get supabaseServiceRoleKey(): string | null {
    return this.configService.get("SUPABASE_SERVICE_ROLE_KEY", {
      infer: true,
    });
  }

  get enterpriseDividendAnalysisCsvPath(): string {
    return this.configService.get("ENTERPRISE_DIVIDEND_ANALYSIS_CSV_PATH", {
      infer: true,
    });
  }

  get enterpriseDividendRawDir(): string {
    return this.configService.get("ENTERPRISE_DIVIDEND_RAW_DIR", {
      infer: true,
    });
  }

  get enterpriseDividendScoreVersion(): string {
    return this.configService.get("ENTERPRISE_DIVIDEND_SCORE_VERSION", {
      infer: true,
    });
  }

  get enterpriseDataFetchTimeoutMs(): number {
    return this.configService.get("ENTERPRISE_DATA_FETCH_TIMEOUT_MS", {
      infer: true,
    });
  }

  get jquantsApiBaseUrl(): string {
    return this.configService.get("JQUANTS_API_BASE_URL", { infer: true });
  }

  get jquantsApiKey(): string | null {
    return this.configService.get("JQUANTS_API_KEY", { infer: true });
  }

  get jquantsIdToken(): string | null {
    return this.configService.get("JQUANTS_ID_TOKEN", { infer: true });
  }

  get edinetApiBaseUrl(): string {
    return this.configService.get("EDINET_API_BASE_URL", { infer: true });
  }

  get edinetApiKey(): string | null {
    return this.configService.get("EDINET_API_KEY", { infer: true });
  }

  get highDividendCandidateCsvPath(): string {
    return this.configService.get("HIGH_DIVIDEND_CANDIDATE_CSV_PATH", {
      infer: true,
    });
  }
}
