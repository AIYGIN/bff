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
  CORS_ORIGINS: string[];
  LOG_LEVEL: LogLevel;
  USER_API_BASE_URL: string | null;
}

const isOneOf = <T extends string>(
  value: unknown,
  allowedValues: readonly T[],
): value is T =>
  typeof value === "string" &&
  (allowedValues as readonly string[]).includes(value);

const parseUrl = (key: string, value: unknown): string => {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${key} must be a valid URL`);
  }

  const normalized = value.trim();
  try {
    const url = new URL(normalized);
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("unsupported protocol");
    }
  } catch {
    throw new Error(`${key} must be a valid HTTP(S) URL`);
  }

  return normalized;
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
      : typeof rawPort === "string" && rawPort.trim() !== ""
        ? Number(rawPort)
        : Number.NaN;
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }

  const rawCorsOrigin =
    typeof environment.CORS_ORIGIN === "string"
      ? environment.CORS_ORIGIN
      : "http://localhost:3000";
  const corsOrigins = rawCorsOrigin
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0)
    .map((origin) => parseUrl("CORS_ORIGIN", origin));
  if (corsOrigins.length === 0) {
    throw new Error("CORS_ORIGIN must include at least one origin");
  }

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
      : parseUrl("USER_API_BASE_URL", rawUserApiBaseUrl);
  if (rawNodeEnv === "production" && userApiBaseUrl === null) {
    throw new Error("USER_API_BASE_URL is required in production");
  }

  return {
    NODE_ENV: rawNodeEnv,
    PORT: port,
    CORS_ORIGINS: corsOrigins,
    LOG_LEVEL: rawLogLevel,
    USER_API_BASE_URL: userApiBaseUrl,
  };
};
