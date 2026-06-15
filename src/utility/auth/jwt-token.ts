import { randomBytes } from "node:crypto";
import type { CurrentUser } from "../../guard/current-user";

const CLOCK_TOLERANCE_SECONDS = 30;
const MAX_ACCESS_TOKEN_LENGTH = 4096;
const SUBJECT_PATTERN = /^usr_v1_[A-Za-z0-9_-]{43}$/;
const ACCESS_TOKEN_CLAIMS = new Set([
  "aud",
  "displayName",
  "exp",
  "iat",
  "iss",
  "jti",
  "profileImageUrl",
  "sub",
]);

export interface JwtCodec {
  signAsync(
    payload: Record<string, unknown>,
    options: Record<string, unknown>,
  ): Promise<string>;
  verifyAsync(
    token: string,
    options: Record<string, unknown>,
  ): Promise<Record<string, unknown>>;
}

export interface JwtTokenConfig {
  secret: string;
  ttlSeconds: number;
  issuer: string;
  audience: string;
}

const validHttpUrl = (value: unknown): value is string => {
  if (typeof value !== "string") {
    return false;
  }
  try {
    const url = new URL(value);
    return (
      ["http:", "https:"].includes(url.protocol) &&
      url.username === "" &&
      url.password === ""
    );
  } catch {
    return false;
  }
};

export const signAccessToken = (
  jwtCodec: JwtCodec,
  currentUser: CurrentUser,
  config: JwtTokenConfig,
): Promise<string> =>
  jwtCodec.signAsync(
    {
      displayName: currentUser.displayName,
      ...(currentUser.profileImageUrl === undefined
        ? {}
        : { profileImageUrl: currentUser.profileImageUrl }),
    },
    {
      secret: Buffer.from(config.secret, "base64url"),
      algorithm: "HS256",
      issuer: config.issuer,
      audience: config.audience,
      subject: currentUser.subject,
      jwtid: randomBytes(16).toString("base64url"),
      expiresIn: config.ttlSeconds,
    },
  );

export const verifyAccessToken = async (
  jwtCodec: JwtCodec,
  token: string,
  config: JwtTokenConfig,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<CurrentUser> => {
  if (token.length === 0 || token.length > MAX_ACCESS_TOKEN_LENGTH) {
    throw new Error("Invalid access token");
  }
  const payload = await jwtCodec.verifyAsync(token, {
    secret: Buffer.from(config.secret, "base64url"),
    algorithms: ["HS256"],
    issuer: config.issuer,
    audience: config.audience,
    clockTolerance: CLOCK_TOLERANCE_SECONDS,
  });
  if (
    Object.keys(payload).some((claim) => !ACCESS_TOKEN_CLAIMS.has(claim)) ||
    typeof payload.sub !== "string" ||
    !SUBJECT_PATTERN.test(payload.sub) ||
    typeof payload.jti !== "string" ||
    !/^[A-Za-z0-9_-]{22}$/.test(payload.jti) ||
    !Number.isInteger(payload.iat) ||
    !Number.isInteger(payload.exp) ||
    (payload.exp as number) - (payload.iat as number) !== config.ttlSeconds ||
    (payload.iat as number) > nowSeconds + CLOCK_TOLERANCE_SECONDS ||
    typeof payload.displayName !== "string" ||
    payload.displayName.trim() === "" ||
    (payload.profileImageUrl !== undefined &&
      !validHttpUrl(payload.profileImageUrl))
  ) {
    throw new Error("Invalid access token claims");
  }

  return {
    subject: payload.sub,
    displayName: payload.displayName,
    ...(payload.profileImageUrl === undefined
      ? {}
      : { profileImageUrl: payload.profileImageUrl }),
  };
};
