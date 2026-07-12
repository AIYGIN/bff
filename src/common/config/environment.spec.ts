import { validateEnvironment } from "./environment";

describe("validateEnvironment", () => {
  const productionAuthEnvironment = {
    NODE_ENV: "production",
    GOOGLE_OAUTH_CLIENT_ID: "google-client",
    GOOGLE_OAUTH_CLIENT_SECRET: "google-secret",
    GOOGLE_OAUTH_REDIRECT_URI: "https://bff.example.com/auth/google/callback",
    AUTH_SUCCESS_REDIRECT_URL: "https://frontend.example.com/auth/success",
    AUTH_FAILURE_REDIRECT_URL: "https://frontend.example.com/auth/failure",
    OAUTH_STATE_SIGNING_SECRET: Buffer.alloc(32, 1).toString("base64url"),
    JWT_ACCESS_SECRET: Buffer.alloc(32, 2).toString("base64url"),
    JWT_ISSUER: "bff",
    JWT_AUDIENCE: "frontend",
    SUBJECT_DERIVATION_SECRET: Buffer.alloc(32, 3).toString("base64url"),
    SUPABASE_URL: "https://project.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "supabase-service-role-key",
    S3_ENDPOINT: "https://minio.example.com",
    S3_REGION: "us-east-1",
    S3_ACCESS_KEY: "minio-access",
    S3_SECRET_KEY: "minio-secret",
    S3_BUCKET: "company-data",
    S3_AI_SUMMARY_KEY_PREFIX: "",
  } as const;

  it("applies development defaults", () => {
    expect(validateEnvironment({})).toEqual({
      NODE_ENV: "development",
      PORT: 3001,
      CORS_ORIGINS: ["http://localhost:3000"],
      LOG_LEVEL: "debug",
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
      SUPABASE_URL: null,
      SUPABASE_SERVICE_ROLE_KEY: null,
      ENTERPRISE_DIVIDEND_ANALYSIS_CSV_PATH:
        ".data/enterprises/unified-dividend-analysis.csv",
      ENTERPRISE_DIVIDEND_RAW_DIR: "private-data/enterprises/raw",
      ENTERPRISE_DIVIDEND_SCORE_VERSION: "dividend-score-v1",
      ENTERPRISE_DATA_FETCH_TIMEOUT_MS: 10000,
      S3_ENDPOINT: "http://localhost:9000/",
      S3_REGION: "us-east-1",
      S3_ACCESS_KEY: null,
      S3_SECRET_KEY: null,
      S3_BUCKET: "company-data",
      S3_AI_SUMMARY_KEY_PREFIX: "",
      JQUANTS_API_BASE_URL: "https://api.jquants.com/",
      JQUANTS_API_KEY: null,
      JQUANTS_ID_TOKEN: null,
      EDINET_API_BASE_URL: "https://disclosure2.edinet-fsa.go.jp/api/v2",
      EDINET_API_KEY: null,
      HIGH_DIVIDEND_CANDIDATE_CSV_PATH:
        "private-data/enterprises/high-dividend-candidates.csv",
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
        SUPABASE_URL: "https://another-project.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "another-supabase-service-role-key",
        ENTERPRISE_DIVIDEND_ANALYSIS_CSV_PATH:
          "private-data/enterprises/generated/unified-dividend-analysis.csv",
        ENTERPRISE_DIVIDEND_RAW_DIR: "private-data/enterprises/raw-dump",
        ENTERPRISE_DIVIDEND_SCORE_VERSION: "dividend-score-v2",
        ENTERPRISE_DATA_FETCH_TIMEOUT_MS: "2000",
        S3_ENDPOINT: "https://minio.example.com",
        S3_REGION: "ap-northeast-1",
        S3_ACCESS_KEY: "minio-access",
        S3_SECRET_KEY: "minio-secret",
        S3_BUCKET: "company-data-prod",
        S3_AI_SUMMARY_KEY_PREFIX: "ai-summary/current/",
        JQUANTS_API_BASE_URL: "https://jquants.example.com",
        JQUANTS_API_KEY: "jquants-api-key",
        JQUANTS_ID_TOKEN: "jquants-token",
        EDINET_API_BASE_URL: "https://edinet.example.com/api/v2",
        EDINET_API_KEY: "edinet-key",
        HIGH_DIVIDEND_CANDIDATE_CSV_PATH:
          "private-data/enterprises/candidates.csv",
      }),
    ).toEqual({
      NODE_ENV: "production",
      PORT: 8080,
      CORS_ORIGINS: ["https://app.example.com", "https://admin.example.com"],
      LOG_LEVEL: "warn",
      GOOGLE_OAUTH_CLIENT_ID: "google-client",
      GOOGLE_OAUTH_CLIENT_SECRET: "google-secret",
      GOOGLE_OAUTH_REDIRECT_URI: "https://bff.example.com/auth/google/callback",
      AUTH_SUCCESS_REDIRECT_URL: "https://frontend.example.com/auth/success",
      AUTH_FAILURE_REDIRECT_URL: "https://frontend.example.com/auth/failure",
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
      SUPABASE_URL: "https://another-project.supabase.co/",
      SUPABASE_SERVICE_ROLE_KEY: "another-supabase-service-role-key",
      ENTERPRISE_DIVIDEND_ANALYSIS_CSV_PATH:
        "private-data/enterprises/generated/unified-dividend-analysis.csv",
      ENTERPRISE_DIVIDEND_RAW_DIR: "private-data/enterprises/raw-dump",
      ENTERPRISE_DIVIDEND_SCORE_VERSION: "dividend-score-v2",
      ENTERPRISE_DATA_FETCH_TIMEOUT_MS: 2000,
      S3_ENDPOINT: "https://minio.example.com/",
      S3_REGION: "ap-northeast-1",
      S3_ACCESS_KEY: "minio-access",
      S3_SECRET_KEY: "minio-secret",
      S3_BUCKET: "company-data-prod",
      S3_AI_SUMMARY_KEY_PREFIX: "ai-summary/current/",
      JQUANTS_API_BASE_URL: "https://jquants.example.com/",
      JQUANTS_API_KEY: "jquants-api-key",
      JQUANTS_ID_TOKEN: "jquants-token",
      EDINET_API_BASE_URL: "https://edinet.example.com/api/v2",
      EDINET_API_KEY: "edinet-key",
      HIGH_DIVIDEND_CANDIDATE_CSV_PATH:
        "private-data/enterprises/candidates.csv",
    });
  });

  it("normalizes and deduplicates CORS origins", () => {
    expect(
      validateEnvironment({
        CORS_ORIGIN:
          "https://app.example.com/,https://app.example.com,http://localhost:3000",
      }).CORS_ORIGINS,
    ).toEqual(["https://app.example.com", "http://localhost:3000"]);
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
    [{ OAUTH_STATE_TTL_SECONDS: "299" }, "OAUTH_STATE_TTL_SECONDS"],
    [{ OAUTH_STATE_TTL_SECONDS: "901" }, "OAUTH_STATE_TTL_SECONDS"],
    [{ JWT_ACCESS_TTL_SECONDS: "299" }, "JWT_ACCESS_TTL_SECONDS"],
    [{ JWT_ACCESS_TTL_SECONDS: "3601" }, "JWT_ACCESS_TTL_SECONDS"],
    [{ GOOGLE_OAUTH_TIMEOUT_MS: "999" }, "GOOGLE_OAUTH_TIMEOUT_MS"],
    [{ GOOGLE_OAUTH_TIMEOUT_MS: "10001" }, "GOOGLE_OAUTH_TIMEOUT_MS"],
    [
      { ENTERPRISE_DATA_FETCH_TIMEOUT_MS: "999" },
      "ENTERPRISE_DATA_FETCH_TIMEOUT_MS",
    ],
    [
      { ENTERPRISE_DATA_FETCH_TIMEOUT_MS: "30001" },
      "ENTERPRISE_DATA_FETCH_TIMEOUT_MS",
    ],
    [{ SUPABASE_URL: "not-a-url" }, "SUPABASE_URL"],
    [{ SUPABASE_URL: "https://user:pass@project.supabase.co" }, "SUPABASE_URL"],
    [
      { SUPABASE_URL: "https://project.supabase.co?token=secret" },
      "SUPABASE_URL",
    ],
    [
      { GOOGLE_OAUTH_REDIRECT_URI: "https://example.com/wrong" },
      "GOOGLE_OAUTH_REDIRECT_URI",
    ],
    [{ JQUANTS_API_BASE_URL: "not-a-url" }, "JQUANTS_API_BASE_URL"],
    [{ EDINET_API_BASE_URL: "not-a-url" }, "EDINET_API_BASE_URL"],
    [
      { OAUTH_STATE_SIGNING_SECRET: Buffer.alloc(31).toString("base64url") },
      "OAUTH_STATE_SIGNING_SECRET",
    ],
  ])("rejects invalid configuration: %p", (environment, key) => {
    expect(() => validateEnvironment(environment)).toThrow(key);
  });

  it.each([
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
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "S3_ACCESS_KEY",
    "S3_SECRET_KEY",
  ])("requires %s in production", (key) => {
    const environment = { ...productionAuthEnvironment };
    delete (environment as Record<string, unknown>)[key];

    expect(() => validateEnvironment(environment)).toThrow(key);
  });

  it("uses info as the production log level default", () => {
    expect(validateEnvironment(productionAuthEnvironment).LOG_LEVEL).toBe(
      "info",
    );
  });

  it("requires HTTPS redirect URLs in production", () => {
    expect(() =>
      validateEnvironment({
        ...productionAuthEnvironment,
        AUTH_SUCCESS_REDIRECT_URL: "http://frontend.example.com/auth/success",
      }),
    ).toThrow("AUTH_SUCCESS_REDIRECT_URL");
  });

  it("rejects reuse of cryptographic secrets", () => {
    expect(() =>
      validateEnvironment({
        OAUTH_STATE_SIGNING_SECRET: Buffer.alloc(32, 1).toString("base64url"),
        JWT_ACCESS_SECRET: Buffer.alloc(32, 1).toString("base64url"),
      }),
    ).toThrow("must be different");
  });

  it.each([
    "OAUTH_STATE_SIGNING_SECRET",
    "JWT_ACCESS_SECRET",
    "SUBJECT_DERIVATION_SECRET",
  ])("rejects a malformed %s", (key) => {
    expect(() =>
      validateEnvironment({
        [key]: Buffer.alloc(31).toString("base64url"),
      }),
    ).toThrow(key);
  });

  it.each([
    ["OAUTH_STATE_SIGNING_SECRET", "JWT_ACCESS_SECRET"],
    ["OAUTH_STATE_SIGNING_SECRET", "SUBJECT_DERIVATION_SECRET"],
    ["JWT_ACCESS_SECRET", "SUBJECT_DERIVATION_SECRET"],
  ])("rejects reuse between %s and %s", (first, second) => {
    const secret = Buffer.alloc(32, 9).toString("base64url");

    expect(() =>
      validateEnvironment({
        [first]: secret,
        [second]: secret,
      }),
    ).toThrow("must be different");
  });

  it.each([
    [
      "GOOGLE_OAUTH_REDIRECT_URI",
      "https://user:password@bff.example.com/auth/google/callback",
    ],
    [
      "GOOGLE_OAUTH_REDIRECT_URI",
      "https://bff.example.com/auth/google/callback?token=secret",
    ],
    [
      "GOOGLE_OAUTH_REDIRECT_URI",
      "https://bff.example.com/auth/google/callback#fragment",
    ],
    [
      "AUTH_SUCCESS_REDIRECT_URL",
      "https://user:password@frontend.example.com/auth/success",
    ],
    ["AUTH_FAILURE_REDIRECT_URL", "ftp://frontend.example.com/auth/failure"],
  ])("rejects unsafe Auth URL %s", (key, value) => {
    expect(() => validateEnvironment({ [key]: value })).toThrow(key);
  });

  it("does not expose a mutable CORS origin array", () => {
    const configuration = validateEnvironment({});

    expect(Object.isFrozen(configuration.CORS_ORIGINS)).toBe(true);
  });
});
