export const APP_ENVIRONMENTS = [
  "development",
  "test",
  "production",
] as const;
export type AppEnvironment = (typeof APP_ENVIRONMENTS)[number];

export const LOG_LEVELS = [
  "fatal",
  "error",
  "warn",
  "info",
  "debug",
  "trace",
  "silent",
] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

export interface EnvironmentVariables {
  NODE_ENV: AppEnvironment;
  PORT: number;
  CORS_ORIGINS: readonly string[];
  LOG_LEVEL: LogLevel;
  USER_API_BASE_URL: string | null;
  GOOGLE_OAUTH_CLIENT_ID: string | null;
  GOOGLE_OAUTH_CLIENT_SECRET: string | null;
  GOOGLE_OAUTH_REDIRECT_URI: string | null;
  AUTH_SUCCESS_REDIRECT_URL: string | null;
  AUTH_FAILURE_REDIRECT_URL: string | null;
  OAUTH_STATE_SIGNING_SECRET: string | null;
  OAUTH_STATE_TTL_SECONDS: number;
  JWT_ACCESS_SECRET: string | null;
  JWT_ACCESS_TTL_SECONDS: number;
  JWT_ISSUER: string | null;
  JWT_AUDIENCE: string | null;
  SUBJECT_DERIVATION_SECRET: string | null;
  GOOGLE_OAUTH_TIMEOUT_MS: number;
}

const isOneOf = <T extends string>(
  value: unknown,
  allowedValues: readonly T[],
): value is T =>
  typeof value === "string" &&
  (allowedValues as readonly string[]).includes(value);

const parseHttpUrl = (key: string, value: unknown): URL => {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${key} must be a valid URL`);
  }

  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error(`${key} must be a valid HTTP(S) URL`);
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error(`${key} must be a valid HTTP(S) URL`);
  }
  if (url.username !== "" || url.password !== "") {
    throw new Error(`${key} must not include credentials`);
  }

  return url;
};

const parseCorsOrigin = (value: string): string => {
  const url = parseHttpUrl("CORS_ORIGIN", value);
  if (
    !["", "/"].includes(url.pathname) ||
    url.search !== "" ||
    url.hash !== ""
  ) {
    throw new Error("CORS_ORIGIN entries must be origins without path/query");
  }

  return url.origin;
};

const parseUserApiBaseUrl = (value: unknown): string => {
  const url = parseHttpUrl("USER_API_BASE_URL", value);
  if (url.search !== "" || url.hash !== "") {
    throw new Error("USER_API_BASE_URL must not include query or fragment");
  }

  const normalizedPath = url.pathname.replace(/\/+$/, "");
  return `${url.origin}${normalizedPath}`;
};

const parseOptionalNonEmpty = (
  key: string,
  value: unknown,
): string | null => {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${key} must be a non-empty string`);
  }

  return value.trim();
};

const parseInteger = (
  key: string,
  value: unknown,
  defaultValue: number,
  minimum: number,
  maximum: number,
): number => {
  const rawValue = value ?? defaultValue;
  const parsed =
    typeof rawValue === "number"
      ? rawValue
      : typeof rawValue === "string" &&
          /^[0-9]+$/.test(rawValue.trim())
        ? Number(rawValue)
        : Number.NaN;
  if (
    !Number.isInteger(parsed) ||
    parsed < minimum ||
    parsed > maximum
  ) {
    throw new Error(
      `${key} must be an integer between ${minimum} and ${maximum}`,
    );
  }

  return parsed;
};

const parseOptionalUrl = (
  key: string,
  value: unknown,
  nodeEnv: AppEnvironment,
  requiredPath?: string,
): string | null => {
  const normalized = parseOptionalNonEmpty(key, value);
  if (normalized === null) {
    return null;
  }
  const url = parseHttpUrl(key, normalized);
  if (url.search !== "" || url.hash !== "") {
    throw new Error(`${key} must not include query or fragment`);
  }
  if (nodeEnv === "production" && url.protocol !== "https:") {
    throw new Error(`${key} must use HTTPS in production`);
  }
  if (requiredPath !== undefined && url.pathname !== requiredPath) {
    throw new Error(`${key} path must be ${requiredPath}`);
  }

  return url.toString();
};

const parseOptionalSecret = (
  key: string,
  value: unknown,
): string | null => {
  const secret = parseOptionalNonEmpty(key, value);
  if (secret === null) {
    return null;
  }
  if (!/^[A-Za-z0-9_-]+$/.test(secret)) {
    throw new Error(`${key} must be base64url without padding`);
  }
  const decoded = Buffer.from(secret, "base64url");
  if (
    decoded.length < 32 ||
    decoded.toString("base64url") !== secret
  ) {
    throw new Error(`${key} must decode to at least 32 bytes`);
  }

  return secret;
};

const requireProductionValue = (
  nodeEnv: AppEnvironment,
  key: string,
  value: string | null,
): void => {
  if (nodeEnv === "production" && value === null) {
    throw new Error(`${key} is required in production`);
  }
};

export const validateEnvironment = (
  environment: Record<string, unknown>,
): EnvironmentVariables => {
  const rawNodeEnv = environment.NODE_ENV ?? "development";
  if (!isOneOf(rawNodeEnv, APP_ENVIRONMENTS)) {
    throw new Error(
      `NODE_ENV must be one of: ${APP_ENVIRONMENTS.join(", ")}`,
    );
  }

  const rawPort = environment.PORT ?? 3001;
  const port =
    typeof rawPort === "number"
      ? rawPort
      : typeof rawPort === "string" && /^[0-9]+$/.test(rawPort.trim())
        ? Number(rawPort)
        : Number.NaN;
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }

  const rawCorsOrigin =
    typeof environment.CORS_ORIGIN === "string"
      ? environment.CORS_ORIGIN
      : "http://localhost:3000";
  const corsOrigins = [
    ...new Set(
      rawCorsOrigin
        .split(",")
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0)
        .map(parseCorsOrigin),
    ),
  ];
  if (corsOrigins.length === 0) {
    throw new Error("CORS_ORIGIN must include at least one origin");
  }
  Object.freeze(corsOrigins);

  const defaultLogLevel = rawNodeEnv === "production" ? "info" : "debug";
  const rawLogLevel = environment.LOG_LEVEL ?? defaultLogLevel;
  if (!isOneOf(rawLogLevel, LOG_LEVELS)) {
    throw new Error(`LOG_LEVEL must be one of: ${LOG_LEVELS.join(", ")}`);
  }

  const rawUserApiBaseUrl = environment.USER_API_BASE_URL;
  const userApiBaseUrl =
    rawUserApiBaseUrl === undefined ||
    rawUserApiBaseUrl === null ||
    rawUserApiBaseUrl === ""
      ? null
      : parseUserApiBaseUrl(rawUserApiBaseUrl);
  if (rawNodeEnv === "production" && userApiBaseUrl === null) {
    throw new Error("USER_API_BASE_URL is required in production");
  }

  const googleOAuthClientId = parseOptionalNonEmpty(
    "GOOGLE_OAUTH_CLIENT_ID",
    environment.GOOGLE_OAUTH_CLIENT_ID,
  );
  const googleOAuthClientSecret = parseOptionalNonEmpty(
    "GOOGLE_OAUTH_CLIENT_SECRET",
    environment.GOOGLE_OAUTH_CLIENT_SECRET,
  );
  const googleOAuthRedirectUri = parseOptionalUrl(
    "GOOGLE_OAUTH_REDIRECT_URI",
    environment.GOOGLE_OAUTH_REDIRECT_URI,
    rawNodeEnv,
    "/auth/google/callback",
  );
  const authSuccessRedirectUrl = parseOptionalUrl(
    "AUTH_SUCCESS_REDIRECT_URL",
    environment.AUTH_SUCCESS_REDIRECT_URL,
    rawNodeEnv,
  );
  const authFailureRedirectUrl = parseOptionalUrl(
    "AUTH_FAILURE_REDIRECT_URL",
    environment.AUTH_FAILURE_REDIRECT_URL,
    rawNodeEnv,
  );
  const oauthStateSigningSecret = parseOptionalSecret(
    "OAUTH_STATE_SIGNING_SECRET",
    environment.OAUTH_STATE_SIGNING_SECRET,
  );
  const oauthStateTtlSeconds = parseInteger(
    "OAUTH_STATE_TTL_SECONDS",
    environment.OAUTH_STATE_TTL_SECONDS,
    600,
    300,
    900,
  );
  const jwtAccessSecret = parseOptionalSecret(
    "JWT_ACCESS_SECRET",
    environment.JWT_ACCESS_SECRET,
  );
  const jwtAccessTtlSeconds = parseInteger(
    "JWT_ACCESS_TTL_SECONDS",
    environment.JWT_ACCESS_TTL_SECONDS,
    3600,
    300,
    3600,
  );
  const jwtIssuer = parseOptionalNonEmpty(
    "JWT_ISSUER",
    environment.JWT_ISSUER,
  );
  const jwtAudience = parseOptionalNonEmpty(
    "JWT_AUDIENCE",
    environment.JWT_AUDIENCE,
  );
  const subjectDerivationSecret = parseOptionalSecret(
    "SUBJECT_DERIVATION_SECRET",
    environment.SUBJECT_DERIVATION_SECRET,
  );
  const googleOAuthTimeoutMs = parseInteger(
    "GOOGLE_OAUTH_TIMEOUT_MS",
    environment.GOOGLE_OAUTH_TIMEOUT_MS,
    5000,
    1000,
    10000,
  );

  const productionValues = [
    ["GOOGLE_OAUTH_CLIENT_ID", googleOAuthClientId],
    ["GOOGLE_OAUTH_CLIENT_SECRET", googleOAuthClientSecret],
    ["GOOGLE_OAUTH_REDIRECT_URI", googleOAuthRedirectUri],
    ["AUTH_SUCCESS_REDIRECT_URL", authSuccessRedirectUrl],
    ["AUTH_FAILURE_REDIRECT_URL", authFailureRedirectUrl],
    ["OAUTH_STATE_SIGNING_SECRET", oauthStateSigningSecret],
    ["JWT_ACCESS_SECRET", jwtAccessSecret],
    ["JWT_ISSUER", jwtIssuer],
    ["JWT_AUDIENCE", jwtAudience],
    ["SUBJECT_DERIVATION_SECRET", subjectDerivationSecret],
  ] as const;
  for (const [key, value] of productionValues) {
    requireProductionValue(rawNodeEnv, key, value);
  }

  const configuredSecrets = [
    oauthStateSigningSecret,
    jwtAccessSecret,
    subjectDerivationSecret,
  ].filter((secret): secret is string => secret !== null);
  if (new Set(configuredSecrets).size !== configuredSecrets.length) {
    throw new Error("Cryptographic secrets must be different");
  }

  return {
    NODE_ENV: rawNodeEnv,
    PORT: port,
    CORS_ORIGINS: corsOrigins,
    LOG_LEVEL: rawLogLevel,
    USER_API_BASE_URL: userApiBaseUrl,
    GOOGLE_OAUTH_CLIENT_ID: googleOAuthClientId,
    GOOGLE_OAUTH_CLIENT_SECRET: googleOAuthClientSecret,
    GOOGLE_OAUTH_REDIRECT_URI: googleOAuthRedirectUri,
    AUTH_SUCCESS_REDIRECT_URL: authSuccessRedirectUrl,
    AUTH_FAILURE_REDIRECT_URL: authFailureRedirectUrl,
    OAUTH_STATE_SIGNING_SECRET: oauthStateSigningSecret,
    OAUTH_STATE_TTL_SECONDS: oauthStateTtlSeconds,
    JWT_ACCESS_SECRET: jwtAccessSecret,
    JWT_ACCESS_TTL_SECONDS: jwtAccessTtlSeconds,
    JWT_ISSUER: jwtIssuer,
    JWT_AUDIENCE: jwtAudience,
    SUBJECT_DERIVATION_SECRET: subjectDerivationSecret,
    GOOGLE_OAUTH_TIMEOUT_MS: googleOAuthTimeoutMs,
  };
};
