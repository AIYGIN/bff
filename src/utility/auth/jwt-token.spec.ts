import { JwtService } from "@nestjs/jwt";
import {
  signAccessToken,
  verifyAccessToken,
} from "./jwt-token";

describe("JWT token utilities", () => {
  const subject = `usr_v1_${"A".repeat(43)}`;
  const jwtAccessSecret = Buffer.alloc(32, 2).toString("base64url");
  const config = {
    secret: jwtAccessSecret,
    ttlSeconds: 3600,
    audience: "bff-frontend",
    issuer: "bff",
  };

  it("signs and verifies display claims with an opaque subject", async () => {
    const jwtService = new JwtService();
    const token = await signAccessToken(jwtService, {
      subject,
      displayName: "Sample User",
      profileImageUrl: "https://example.com/profile.jpg",
    }, config);
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
    await expect(
      verifyAccessToken(jwtService, token, config),
    ).resolves.toEqual({
      subject,
      displayName: "Sample User",
      profileImageUrl: "https://example.com/profile.jpg",
    });
  });

  it("omits an absent profile image claim", async () => {
    const jwtService = new JwtService();
    const token = await signAccessToken(jwtService, {
      subject,
      displayName: "Sample User",
    }, config);
    const currentUser = await verifyAccessToken(
      jwtService,
      token,
      config,
    );

    expect(currentUser).toEqual({
      subject,
      displayName: "Sample User",
    });
    expect(currentUser).not.toHaveProperty("profileImageUrl");
  });

  it("rejects invalid tokens", async () => {
    await expect(
      verifyAccessToken(new JwtService(), "invalid.jwt.token", config),
    ).rejects.toBeDefined();
  });

  it.each([
    ["wrong issuer", { issuer: "other", algorithm: "HS256" as const }],
    ["wrong algorithm", { issuer: "bff", algorithm: "HS512" as const }],
  ])("rejects a token with %s", async (_name, options) => {
    const jwtService = new JwtService();
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
      verifyAccessToken(jwtService, token, config),
    ).rejects.toBeDefined();
  });

  it("rejects an expired token", async () => {
    const jwtService = new JwtService();
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
      verifyAccessToken(jwtService, token, config),
    ).rejects.toBeDefined();
  });

  it.each([
    ["email", "private@example.com"],
    ["providerUserId", "google-user-123"],
    ["providerAccessToken", "google-access-token"],
  ])("rejects a signed token containing sensitive claim %s", async (key, value) => {
    const jwtService = new JwtService();
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
      verifyAccessToken(jwtService, token, config),
    ).rejects.toBeDefined();
  });
});
