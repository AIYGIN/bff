import {
  accessTokenCookieOptions,
  authCookieClearOptions,
  oauthStateCookieOptions,
} from "./auth-cookie";

describe("Auth Cookie utilities", () => {
  it("uses configured TTL values and non-production Cookie attributes", () => {
    const config = {
      nodeEnv: "test",
      oauthStateTtlSeconds: 600,
      jwtAccessTtlSeconds: 3600,
    } as const;

    expect(oauthStateCookieOptions(config)).toEqual({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: false,
      maxAge: 600_000,
    });
    expect(accessTokenCookieOptions(config)).toEqual({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: false,
      maxAge: 3_600_000,
    });
  });

  it("uses Secure and matching clear attributes in production", () => {
    const config = {
      nodeEnv: "production",
      oauthStateTtlSeconds: 600,
      jwtAccessTtlSeconds: 3600,
    } as const;

    expect(authCookieClearOptions(config)).toEqual({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: true,
    });
  });
});
