import { validateEnvironment } from "./environment";

describe("validateEnvironment", () => {
  const productionAuthEnvironment = {
    NODE_ENV: "production",
    USER_API_BASE_URL: "https://users.example.com",
    GOOGLE_OAUTH_CLIENT_ID: "google-client",
    GOOGLE_OAUTH_CLIENT_SECRET: "google-secret",
    GOOGLE_OAUTH_REDIRECT_URI:
      "https://bff.example.com/auth/google/callback",
    AUTH_SUCCESS_REDIRECT_URL:
      "https://frontend.example.com/auth/success",
    AUTH_FAILURE_REDIRECT_URL:
      "https://frontend.example.com/auth/failure",
    OAUTH_STATE_SIGNING_SECRET: Buffer.alloc(32, 1).toString("base64url"),
    JWT_ACCESS_SECRET: Buffer.alloc(32, 2).toString("base64url"),
    JWT_ISSUER: "bff",
    JWT_AUDIENCE: "frontend",
    SUBJECT_DERIVATION_SECRET: Buffer.alloc(32, 3).toString("base64url"),
  } as const;

  it("applies development defaults", () => {
    expect(validateEnvironment({})).toEqual({
      NODE_ENV: "development",
      PORT: 3001,
      CORS_ORIGINS: ["http://localhost:3000"],
      LOG_LEVEL: "debug",
      USER_API_BASE_URL: null,
      GOOGLE_OAUTH_CLIENT_ID: null,
      GOOGLE_OAUTH_CLIENT_SECRET: null,
      GOOGLE_OAUTH_REDIRECT_URI: null,
      AUTH_SUCCESS_REDIRECT_URL: null,
      AUTH_FAILURE_REDIRECT_URL: null,
      OAUTH_STATE_SIGNING_SECRET: null,
      OAUTH_STATE_TTL_SECONDS: 600,
      JWT_ACCESS_SECRET: null,
      JWT_ACCESS_TTL_SECONDS: 3600,
      JWT_ISSUER: null,
      JWT_AUDIENCE: null,
      SUBJECT_DERIVATION_SECRET: null,
      GOOGLE_OAUTH_TIMEOUT_MS: 5000,
    });
  });

  it("converts configured values to typed values", () => {
    expect(
      validateEnvironment({
        ...productionAuthEnvironment,
        PORT: "8080",
        CORS_ORIGIN: "https://app.example.com, https://admin.example.com ",
        LOG_LEVEL: "warn",
        OAUTH_STATE_TTL_SECONDS: "601",
        JWT_ACCESS_TTL_SECONDS: "3599",
        GOOGLE_OAUTH_TIMEOUT_MS: "4999",
      }),
    ).toEqual({
      NODE_ENV: "production",
      PORT: 8080,
      CORS_ORIGINS: [
        "https://app.example.com",
        "https://admin.example.com",
      ],
      LOG_LEVEL: "warn",
      USER_API_BASE_URL: "https://users.example.com",
      GOOGLE_OAUTH_CLIENT_ID: "google-client",
      GOOGLE_OAUTH_CLIENT_SECRET: "google-secret",
      GOOGLE_OAUTH_REDIRECT_URI:
        "https://bff.example.com/auth/google/callback",
      AUTH_SUCCESS_REDIRECT_URL:
        "https://frontend.example.com/auth/success",
      AUTH_FAILURE_REDIRECT_URL:
        "https://frontend.example.com/auth/failure",
      OAUTH_STATE_SIGNING_SECRET:
        productionAuthEnvironment.OAUTH_STATE_SIGNING_SECRET,
      OAUTH_STATE_TTL_SECONDS: 601,
      JWT_ACCESS_SECRET: productionAuthEnvironment.JWT_ACCESS_SECRET,
      JWT_ACCESS_TTL_SECONDS: 3599,
      JWT_ISSUER: "bff",
      JWT_AUDIENCE: "frontend",
      SUBJECT_DERIVATION_SECRET:
        productionAuthEnvironment.SUBJECT_DERIVATION_SECRET,
      GOOGLE_OAUTH_TIMEOUT_MS: 4999,
    });
  });

  it("normalizes and deduplicates CORS origins", () => {
    expect(
      validateEnvironment({
        CORS_ORIGIN:
          "https://app.example.com/,https://app.example.com,http://localhost:3000",
      }).CORS_ORIGINS,
    ).toEqual([
      "https://app.example.com",
      "http://localhost:3000",
    ]);
  });

  it("normalizes the User API base URL", () => {
    expect(
      validateEnvironment({
        USER_API_BASE_URL: "https://users.example.com/api/",
      }).USER_API_BASE_URL,
    ).toBe("https://users.example.com/api");
  });

  it.each([
    [{ NODE_ENV: "staging" }, "NODE_ENV"],
    [{ PORT: "0" }, "PORT"],
    [{ PORT: "65536" }, "PORT"],
    [{ PORT: "not-a-number" }, "PORT"],
    [{ PORT: "1e3" }, "PORT"],
    [{ CORS_ORIGIN: "not-a-url" }, "CORS_ORIGIN"],
    [{ CORS_ORIGIN: "https://user:pass@example.com" }, "CORS_ORIGIN"],
    [{ CORS_ORIGIN: "https://example.com/path" }, "CORS_ORIGIN"],
    [{ CORS_ORIGIN: "https://example.com?token=secret" }, "CORS_ORIGIN"],
    [{ CORS_ORIGIN: "https://example.com#fragment" }, "CORS_ORIGIN"],
    [{ LOG_LEVEL: "verbose" }, "LOG_LEVEL"],
    [{ USER_API_BASE_URL: "not-a-url" }, "USER_API_BASE_URL"],
    [
      { USER_API_BASE_URL: "https://user:pass@users.example.com" },
      "USER_API_BASE_URL",
    ],
    [
      { USER_API_BASE_URL: "https://users.example.com?token=secret" },
      "USER_API_BASE_URL",
    ],
    [
      { USER_API_BASE_URL: "https://users.example.com#fragment" },
      "USER_API_BASE_URL",
    ],
    [{ OAUTH_STATE_TTL_SECONDS: "299" }, "OAUTH_STATE_TTL_SECONDS"],
    [{ OAUTH_STATE_TTL_SECONDS: "901" }, "OAUTH_STATE_TTL_SECONDS"],
    [{ JWT_ACCESS_TTL_SECONDS: "299" }, "JWT_ACCESS_TTL_SECONDS"],
    [{ JWT_ACCESS_TTL_SECONDS: "3601" }, "JWT_ACCESS_TTL_SECONDS"],
    [{ GOOGLE_OAUTH_TIMEOUT_MS: "999" }, "GOOGLE_OAUTH_TIMEOUT_MS"],
    [{ GOOGLE_OAUTH_TIMEOUT_MS: "10001" }, "GOOGLE_OAUTH_TIMEOUT_MS"],
    [
      { GOOGLE_OAUTH_REDIRECT_URI: "https://example.com/wrong" },
      "GOOGLE_OAUTH_REDIRECT_URI",
    ],
    [
      { OAUTH_STATE_SIGNING_SECRET: Buffer.alloc(31).toString("base64url") },
      "OAUTH_STATE_SIGNING_SECRET",
    ],
  ])("rejects invalid configuration: %p", (environment, key) => {
    expect(() => validateEnvironment(environment)).toThrow(key);
  });

  it.each([
    "USER_API_BASE_URL",
    "GOOGLE_OAUTH_CLIENT_ID",
    "GOOGLE_OAUTH_CLIENT_SECRET",
    "GOOGLE_OAUTH_REDIRECT_URI",
    "AUTH_SUCCESS_REDIRECT_URL",
    "AUTH_FAILURE_REDIRECT_URL",
    "OAUTH_STATE_SIGNING_SECRET",
    "JWT_ACCESS_SECRET",
    "JWT_ISSUER",
    "JWT_AUDIENCE",
    "SUBJECT_DERIVATION_SECRET",
  ])("requires %s in production", (key) => {
    const environment = { ...productionAuthEnvironment };
    delete (environment as Record<string, unknown>)[key];

    expect(() => validateEnvironment(environment)).toThrow(key);
  });

  it("uses info as the production log level default", () => {
    expect(
      validateEnvironment(productionAuthEnvironment).LOG_LEVEL,
    ).toBe("info");
  });

  it("requires HTTPS redirect URLs in production", () => {
    expect(() =>
      validateEnvironment({
        ...productionAuthEnvironment,
        AUTH_SUCCESS_REDIRECT_URL:
          "http://frontend.example.com/auth/success",
      }),
    ).toThrow("AUTH_SUCCESS_REDIRECT_URL");
  });

  it("rejects reuse of cryptographic secrets", () => {
    expect(() =>
      validateEnvironment({
        OAUTH_STATE_SIGNING_SECRET: Buffer.alloc(32, 1).toString(
          "base64url",
        ),
        JWT_ACCESS_SECRET: Buffer.alloc(32, 1).toString("base64url"),
      }),
    ).toThrow("must be different");
  });

  it("does not expose a mutable CORS origin array", () => {
    const configuration = validateEnvironment({});

    expect(Object.isFrozen(configuration.CORS_ORIGINS)).toBe(true);
  });
});
