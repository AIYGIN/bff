import { Injectable } from "@nestjs/common";
import type { CookieOptions } from "express";
import { AppConfigService } from "../../common/config/app-config.service";

@Injectable()
export class AuthCookieService {
  constructor(private readonly config: AppConfigService) {}

  oauthStateOptions(): CookieOptions {
    return {
      ...this.clearOptions(),
      maxAge: this.config.oauthStateTtlSeconds * 1000,
    };
  }

  accessTokenOptions(): CookieOptions {
    return {
      ...this.clearOptions(),
      maxAge: this.config.jwtAccessTtlSeconds * 1000,
    };
  }

  clearOptions(): CookieOptions {
    return {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: this.config.nodeEnv === "production",
    };
  }
}
