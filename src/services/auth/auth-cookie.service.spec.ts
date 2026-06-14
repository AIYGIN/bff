import { AppConfigService } from "../../common/config/app-config.service";
import { AuthCookieService } from "./auth-cookie.service";

describe("AuthCookieService", () => {
  it("uses configured TTL values and non-production Cookie attributes", () => {
    const service = new AuthCookieService({
      nodeEnv: "test",
      oauthStateTtlSeconds: 600,
      jwtAccessTtlSeconds: 3600,
    } as AppConfigService);

    expect(service.oauthStateOptions()).toEqual({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: false,
      maxAge: 600_000,
    });
    expect(service.accessTokenOptions()).toEqual({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: false,
      maxAge: 3_600_000,
    });
  });

  it("uses Secure and matching clear attributes in production", () => {
    const service = new AuthCookieService({
      nodeEnv: "production",
      oauthStateTtlSeconds: 600,
      jwtAccessTtlSeconds: 3600,
    } as AppConfigService);

    expect(service.clearOptions()).toEqual({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: true,
    });
  });
});
