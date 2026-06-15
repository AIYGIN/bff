import { createHmac } from "node:crypto";

const decodeSecret = (secret: string): Buffer => {
  if (!/^[A-Za-z0-9_-]+$/.test(secret)) {
    throw new Error("Invalid subject derivation secret");
  }
  const decoded = Buffer.from(secret, "base64url");
  if (
    decoded.length < 32 ||
    decoded.toString("base64url") !== secret
  ) {
    throw new Error("Invalid subject derivation secret");
  }
  return decoded;
};

export const deriveOpaqueSubject = (
  provider: "google",
  providerUserId: string,
  secret: string,
): string => {
  const digest = createHmac("sha256", decodeSecret(secret))
    .update(`${provider}\0${providerUserId}`, "utf8")
    .digest("base64url");

  return `usr_v1_${digest}`;
};
