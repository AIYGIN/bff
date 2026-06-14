import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { randomBytes } from "node:crypto";
import type { CurrentUser } from "../../common/auth/current-user";
import { AppConfigService } from "../../common/config/app-config.service";
import { AuthConfigurationException } from "../../lib/errors/auth-configuration.exception";

const CLOCK_TOLERANCE_SECONDS = 30;
const MAX_ACCESS_TOKEN_LENGTH = 4096;
const SUBJECT_PATTERN = /^usr_v1_[A-Za-z0-9_-]{43}$/;
const ACCESS_TOKEN_CLAIMS = new Set([
  "aud",
  "displayName",
  "exp",
  "iat",
  "iss",
  "jti",
  "profileImageUrl",
  "sub",
]);

const requiredConfig = (
  key: string,
  value: string | null,
): string => {
  if (value === null) {
    throw new AuthConfigurationException(key);
  }
  return value;
};

const validHttpUrl = (value: unknown): value is string => {
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
export class JwtTokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: AppConfigService,
  ) {}

  async signAccessToken(currentUser: CurrentUser): Promise<string> {
    const secret = Buffer.from(
      requiredConfig("JWT_ACCESS_SECRET", this.config.jwtAccessSecret),
      "base64url",
    );

    return this.jwtService.signAsync(
      {
        displayName: currentUser.displayName,
        ...(currentUser.profileImageUrl === undefined
          ? {}
          : { profileImageUrl: currentUser.profileImageUrl }),
      },
      {
        secret,
        algorithm: "HS256",
        issuer: requiredConfig("JWT_ISSUER", this.config.jwtIssuer),
        audience: requiredConfig(
          "JWT_AUDIENCE",
          this.config.jwtAudience,
        ),
        subject: currentUser.subject,
        jwtid: randomBytes(16).toString("base64url"),
        expiresIn: this.config.jwtAccessTtlSeconds,
      },
    );
  }

  async verifyAccessToken(token: string): Promise<CurrentUser> {
    const secret = Buffer.from(
      requiredConfig("JWT_ACCESS_SECRET", this.config.jwtAccessSecret),
      "base64url",
    );
    const issuer = requiredConfig("JWT_ISSUER", this.config.jwtIssuer);
    const audience = requiredConfig(
      "JWT_AUDIENCE",
      this.config.jwtAudience,
    );

    try {
      if (token.length === 0 || token.length > MAX_ACCESS_TOKEN_LENGTH) {
        throw new Error("invalid access token");
      }
      const payload = await this.jwtService.verifyAsync(token, {
        secret,
        algorithms: ["HS256"],
        issuer,
        audience,
        clockTolerance: CLOCK_TOLERANCE_SECONDS,
      });
      const now = Math.floor(Date.now() / 1000);
      if (
        Object.keys(payload).some(
          (claim) => !ACCESS_TOKEN_CLAIMS.has(claim),
        ) ||
        typeof payload.sub !== "string" ||
        !SUBJECT_PATTERN.test(payload.sub) ||
        typeof payload.jti !== "string" ||
        !/^[A-Za-z0-9_-]{22}$/.test(payload.jti) ||
        !Number.isInteger(payload.iat) ||
        !Number.isInteger(payload.exp) ||
        payload.exp - payload.iat !== this.config.jwtAccessTtlSeconds ||
        payload.iat > now + CLOCK_TOLERANCE_SECONDS ||
        typeof payload.displayName !== "string" ||
        payload.displayName.trim() === "" ||
        (payload.profileImageUrl !== undefined &&
          !validHttpUrl(payload.profileImageUrl))
      ) {
        throw new Error("invalid access token claims");
      }

      return {
        subject: payload.sub,
        displayName: payload.displayName,
        ...(payload.profileImageUrl === undefined
          ? {}
          : { profileImageUrl: payload.profileImageUrl }),
      };
    } catch {
      throw new UnauthorizedException("Unauthorized");
    }
  }
}
