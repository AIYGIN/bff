import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import type {
  OAuthState,
  VerifiedOAuthState,
} from "../../interface/auth/oauth-state";

const STATE_VERSION = 1;
const CLOCK_TOLERANCE_SECONDS = 30;
const MAX_COOKIE_VALUE_LENGTH = 2048;
const BASE64URL_32_BYTES = /^[A-Za-z0-9_-]{43}$/;
const BASE64URL_VALUE = /^[A-Za-z0-9_-]+$/;

interface OAuthStatePayload {
  v: number;
  state: string;
  codeVerifier: string;
  iat: number;
  exp: number;
}

interface OAuthStateConfig {
  signingSecret: string;
  ttlSeconds: number;
}

const sign = (encodedPayload: string, secret: string): string =>
  createHmac("sha256", Buffer.from(secret, "base64url"))
    .update(encodedPayload, "ascii")
    .digest("base64url");

const isValidPayload = (
  value: unknown,
  ttlSeconds: number,
  nowSeconds: number,
): value is OAuthStatePayload => {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }
  const payload = value as Record<string, unknown>;
  if (
    Object.keys(payload).length !== 5 ||
    payload.v !== STATE_VERSION ||
    typeof payload.state !== "string" ||
    !BASE64URL_32_BYTES.test(payload.state) ||
    typeof payload.codeVerifier !== "string" ||
    !BASE64URL_32_BYTES.test(payload.codeVerifier) ||
    !Number.isInteger(payload.iat) ||
    !Number.isInteger(payload.exp)
  ) {
    return false;
  }
  const iat = payload.iat as number;
  const exp = payload.exp as number;

  return (
    exp - iat === ttlSeconds &&
    nowSeconds >= iat - CLOCK_TOLERANCE_SECONDS &&
    nowSeconds <= exp
  );
};

export const createOAuthState = (
  config: OAuthStateConfig,
  nowSeconds = Math.floor(Date.now() / 1000),
): OAuthState => {
  const state = randomBytes(32).toString("base64url");
  const codeVerifier = randomBytes(32).toString("base64url");
  const codeChallenge = createHash("sha256")
    .update(codeVerifier, "ascii")
    .digest("base64url");
  const payload: OAuthStatePayload = {
    v: STATE_VERSION,
    state,
    codeVerifier,
    iat: nowSeconds,
    exp: nowSeconds + config.ttlSeconds,
  };
  const encodedPayload = Buffer.from(
    JSON.stringify(payload),
    "utf8",
  ).toString("base64url");

  return {
    state,
    codeChallenge,
    cookieValue: `${encodedPayload}.${sign(encodedPayload, config.signingSecret)}`,
  };
};

export const verifyOAuthState = (
  cookieValue: string,
  expectedState: string,
  config: OAuthStateConfig,
  nowSeconds = Math.floor(Date.now() / 1000),
): VerifiedOAuthState => {
  if (
    cookieValue.length === 0 ||
    cookieValue.length > MAX_COOKIE_VALUE_LENGTH ||
    !BASE64URL_32_BYTES.test(expectedState)
  ) {
    throw new Error("Invalid OAuth state");
  }
  const parts = cookieValue.split(".");
  if (parts.length !== 2) {
    throw new Error("Invalid OAuth state");
  }
  const [encodedPayload, encodedSignature] = parts;
  if (
    !BASE64URL_VALUE.test(encodedPayload) ||
    !BASE64URL_32_BYTES.test(encodedSignature)
  ) {
    throw new Error("Invalid OAuth state");
  }
  const payloadBytes = Buffer.from(encodedPayload, "base64url");
  if (payloadBytes.toString("base64url") !== encodedPayload) {
    throw new Error("Invalid OAuth state");
  }
  const actualSignature = Buffer.from(encodedSignature, "base64url");
  const expectedSignature = Buffer.from(
    sign(encodedPayload, config.signingSecret),
    "base64url",
  );
  if (
    actualSignature.length !== expectedSignature.length ||
    !timingSafeEqual(actualSignature, expectedSignature)
  ) {
    throw new Error("Invalid OAuth state");
  }
  const rawPayload = payloadBytes.toString("utf8");
  if (rawPayload.length > 1024) {
    throw new Error("Invalid OAuth state");
  }
  const payload = JSON.parse(rawPayload) as unknown;
  if (!isValidPayload(payload, config.ttlSeconds, nowSeconds)) {
    throw new Error("Invalid OAuth state");
  }
  const actualState = Buffer.from(payload.state, "utf8");
  const expectedStateBytes = Buffer.from(expectedState, "utf8");
  if (
    actualState.length !== expectedStateBytes.length ||
    !timingSafeEqual(actualState, expectedStateBytes)
  ) {
    throw new Error("Invalid OAuth state");
  }

  return {
    state: payload.state,
    codeVerifier: payload.codeVerifier,
  };
};
