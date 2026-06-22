import type { CookieOptions } from "express";

export interface AuthCookieConfig {
  nodeEnv: "development" | "test" | "production";
  oauthStateTtlSeconds: number;
  jwtAccessTtlSeconds: number;
}

export const authCookieClearOptions = (
  config: Pick<AuthCookieConfig, "nodeEnv">,
): CookieOptions => ({
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  secure: config.nodeEnv === "production",
});

export const oauthStateCookieOptions = (
  config: Pick<AuthCookieConfig, "nodeEnv" | "oauthStateTtlSeconds">,
): CookieOptions => ({
  ...authCookieClearOptions(config),
  maxAge: config.oauthStateTtlSeconds * 1000,
});

export const accessTokenCookieOptions = (
  config: Pick<AuthCookieConfig, "nodeEnv" | "jwtAccessTtlSeconds">,
): CookieOptions => ({
  ...authCookieClearOptions(config),
  maxAge: config.jwtAccessTtlSeconds * 1000,
});
