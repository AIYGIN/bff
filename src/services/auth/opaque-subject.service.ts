import { Injectable } from "@nestjs/common";
import { createHmac } from "node:crypto";
import { AppConfigService } from "../../common/config/app-config.service";
import { AuthConfigurationException } from "../../lib/errors/auth-configuration.exception";

@Injectable()
export class OpaqueSubjectService {
  constructor(private readonly config: AppConfigService) {}

  derive(provider: "google", providerUserId: string): string {
    const secret = this.config.subjectDerivationSecret;
    if (secret === null) {
      throw new AuthConfigurationException(
        "SUBJECT_DERIVATION_SECRET",
      );
    }
    const digest = createHmac(
      "sha256",
      Buffer.from(secret, "base64url"),
    )
      .update(`${provider}\0${providerUserId}`, "utf8")
      .digest("base64url");

    return `usr_v1_${digest}`;
  }
}
