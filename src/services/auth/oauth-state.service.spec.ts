import { createHmac } from "node:crypto";
import { BadRequestException } from "@nestjs/common";
import { AppConfigService } from "../../common/config/app-config.service";
import { OAuthStateService } from "./oauth-state.service";

describe("OAuthStateService", () => {
  const signingSecret = Buffer.alloc(32, 1).toString("base64url");
  const config = {
    oauthStateSigningSecret: signingSecret,
    oauthStateTtlSeconds: 600,
  } as AppConfigService;
  const signedCookie = (payload: unknown): string => {
    const encodedPayload = Buffer.from(
      JSON.stringify(payload),
      "utf8",
    ).toString("base64url");
    const signature = createHmac(
      "sha256",
      Buffer.from(signingSecret, "base64url"),
    )
      .update(encodedPayload, "ascii")
      .digest("base64url");

    return `${encodedPayload}.${signature}`;
  };

  it("creates a signed 600 second state with an S256 PKCE challenge", () => {
    const service = new OAuthStateService(config);
    const result = service.create();
    const [encodedPayload] = result.cookieValue.split(".");
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    );

    expect(result.state).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(result.codeChallenge).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(payload).toMatchObject({
      v: 1,
      state: result.state,
    });
    expect(payload.codeVerifier).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(payload.exp - payload.iat).toBe(600);
    expect(result.cookieValue.split(".")).toHaveLength(2);
  });

  it("verifies the signature, lifetime, and expected state", () => {
    const service = new OAuthStateService(config);
    const created = service.create();

    expect(service.verify(created.cookieValue, created.state)).toEqual(
      expect.objectContaining({
        state: created.state,
        codeVerifier: expect.any(String),
      }),
    );
  });

  it.each([
    ["missing Cookie", "", "state"],
    ["malformed value", "not-compact", "state"],
    ["tampered signature", "e30.invalid", "state"],
  ])("rejects %s", (_name, cookieValue, state) => {
    const service = new OAuthStateService(config);
    expect(() => service.verify(cookieValue, state)).toThrow(
      BadRequestException,
    );
  });

  it("rejects a state mismatch", () => {
    const service = new OAuthStateService(config);
    const created = service.create();

    expect(() =>
      service.verify(created.cookieValue, "different-state"),
    ).toThrow(BadRequestException);
  });

  it("rejects non-canonical padded compact encoding", () => {
    const service = new OAuthStateService(config);
    const created = service.create();

    expect(() =>
      service.verify(`${created.cookieValue}=`, created.state),
    ).toThrow(BadRequestException);
  });

  it.each([
    [
      "unsupported version",
      {
        v: 2,
        state: "A".repeat(43),
        codeVerifier: "B".repeat(43),
        iat: 1_767_225_600,
        exp: 1_767_226_200,
      },
    ],
    [
      "wrong field type",
      {
        v: 1,
        state: "A".repeat(43),
        codeVerifier: null,
        iat: 1_767_225_600,
        exp: 1_767_226_200,
      },
    ],
    [
      "wrong TTL",
      {
        v: 1,
        state: "A".repeat(43),
        codeVerifier: "B".repeat(43),
        iat: 1_767_225_600,
        exp: 1_767_226_201,
      },
    ],
    [
      "future issued-at",
      {
        v: 1,
        state: "A".repeat(43),
        codeVerifier: "B".repeat(43),
        iat: 1_767_225_631,
        exp: 1_767_226_231,
      },
    ],
  ])("rejects a validly signed payload with %s", (_name, payload) => {
    jest.useFakeTimers().setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const service = new OAuthStateService(config);

    try {
      expect(() =>
        service.verify(signedCookie(payload), "A".repeat(43)),
      ).toThrow(BadRequestException);
    } finally {
      jest.useRealTimers();
    }
  });

  it("rejects an expired state", () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const service = new OAuthStateService(config);
    const created = service.create();
    jest.setSystemTime(new Date("2026-01-01T00:10:01Z"));

    try {
      expect(() =>
        service.verify(created.cookieValue, created.state),
      ).toThrow(BadRequestException);
    } finally {
      jest.useRealTimers();
    }
  });
});
