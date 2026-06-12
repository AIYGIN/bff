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

  get userApiBaseUrl(): string | null {
    return this.configService.get("USER_API_BASE_URL", { infer: true });
  }
}
