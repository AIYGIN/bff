import { UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AppConfigService } from "../../common/config/app-config.service";
import { JwtTokenService } from "./jwt-token.service";

describe("JwtTokenService", () => {
  const subject = `usr_v1_${"A".repeat(43)}`;
  const jwtAccessSecret = Buffer.alloc(32, 2).toString("base64url");
  const config = {
    jwtAccessSecret,
    jwtAccessTtlSeconds: 3600,
    jwtAudience: "bff-frontend",
    jwtIssuer: "bff",
  } as AppConfigService;

  it("signs and verifies display claims with an opaque subject", async () => {
    const service = new JwtTokenService(new JwtService(), config);
    const token = await service.signAccessToken({
      subject,
      displayName: "Sample User",
      profileImageUrl: "https://example.com/profile.jpg",
    });
    const [, encodedPayload] = token.split(".");
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    );

    expect(payload).toMatchObject({
      iss: "bff",
      aud: "bff-frontend",
      sub: subject,
      displayName: "Sample User",
      profileImageUrl: "https://example.com/profile.jpg",
    });
    expect(payload.exp - payload.iat).toBe(3600);
    expect(payload.jti).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(payload).not.toHaveProperty("email");
    await expect(service.verifyAccessToken(token)).resolves.toEqual({
      subject,
      displayName: "Sample User",
      profileImageUrl: "https://example.com/profile.jpg",
    });
  });

  it("omits an absent profile image claim", async () => {
    const service = new JwtTokenService(new JwtService(), config);
    const token = await service.signAccessToken({
      subject,
      displayName: "Sample User",
    });
    const currentUser = await service.verifyAccessToken(token);

    expect(currentUser).toEqual({
      subject,
      displayName: "Sample User",
    });
    expect(currentUser).not.toHaveProperty("profileImageUrl");
  });

  it("maps invalid tokens to a generic UnauthorizedException", async () => {
    const service = new JwtTokenService(new JwtService(), config);

    await expect(
      service.verifyAccessToken("invalid.jwt.token"),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it.each([
    ["wrong issuer", { issuer: "other", algorithm: "HS256" as const }],
    ["wrong algorithm", { issuer: "bff", algorithm: "HS512" as const }],
  ])("rejects a token with %s", async (_name, options) => {
    const jwtService = new JwtService();
    const service = new JwtTokenService(jwtService, config);
    const token = await jwtService.signAsync(
      { displayName: "Sample User" },
      {
        secret: Buffer.from(jwtAccessSecret, "base64url"),
        algorithm: options.algorithm,
        issuer: options.issuer,
        audience: "bff-frontend",
        subject,
        jwtid: "A".repeat(22),
        expiresIn: 3600,
      },
    );

    await expect(
      service.verifyAccessToken(token),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects an expired token", async () => {
    const jwtService = new JwtService();
    const service = new JwtTokenService(jwtService, config);
    const token = await jwtService.signAsync(
      { displayName: "Sample User" },
      {
        secret: Buffer.from(jwtAccessSecret, "base64url"),
        algorithm: "HS256",
        issuer: "bff",
        audience: "bff-frontend",
        subject,
        jwtid: "A".repeat(22),
        expiresIn: -60,
      },
    );

    await expect(
      service.verifyAccessToken(token),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it.each([
    ["email", "private@example.com"],
    ["providerUserId", "google-user-123"],
    ["providerAccessToken", "google-access-token"],
  ])("rejects a signed token containing sensitive claim %s", async (key, value) => {
    const jwtService = new JwtService();
    const service = new JwtTokenService(jwtService, config);
    const token = await jwtService.signAsync(
      {
        displayName: "Sample User",
        [key]: value,
      },
      {
        secret: Buffer.from(jwtAccessSecret, "base64url"),
        algorithm: "HS256",
        issuer: "bff",
        audience: "bff-frontend",
        subject,
        jwtid: "A".repeat(22),
        expiresIn: 3600,
      },
    );

    await expect(
      service.verifyAccessToken(token),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
