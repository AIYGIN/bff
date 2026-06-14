import { Injectable } from "@nestjs/common";
import { createHmac } from "node:crypto";
import { AppConfigService } from "../../common/config/app-config.service";
import { AuthConfigurationException } from "../../lib/errors/auth-configuration.exception";

const decodeSecret = (secret: string | null): Buffer => {
  if (secret === null || !/^[A-Za-z0-9_-]+$/.test(secret)) {
    throw new AuthConfigurationException(
      "SUBJECT_DERIVATION_SECRET",
    );
  }
  const decoded = Buffer.from(secret, "base64url");
  if (
    decoded.length < 32 ||
    decoded.toString("base64url") !== secret
  ) {
    throw new AuthConfigurationException(
      "SUBJECT_DERIVATION_SECRET",
    );
  }
  return decoded;
};

@Injectable()
export class OpaqueSubjectService {
  constructor(private readonly config: AppConfigService) {}

  derive(provider: "google", providerUserId: string): string {
    const digest = createHmac(
      "sha256",
      decodeSecret(this.config.subjectDerivationSecret),
    )
      .update(`${provider}\0${providerUserId}`, "utf8")
      .digest("base64url");

    return `usr_v1_${digest}`;
  }
}
