import { AppConfigService } from "../../common/config/app-config.service";
import { AuthConfigurationException } from "../../lib/errors/auth-configuration.exception";
import { OpaqueSubjectService } from "./opaque-subject.service";

describe("OpaqueSubjectService", () => {
  const config = {
    subjectDerivationSecret: Buffer.alloc(32, 3).toString("base64url"),
  } as AppConfigService;

  it("derives a stable opaque subject without exposing Provider ID", () => {
    const service = new OpaqueSubjectService(config);

    const first = service.derive("google", "google-user-123");
    const second = service.derive("google", "google-user-123");

    expect(first).toBe(second);
    expect(first).toMatch(/^usr_v1_[A-Za-z0-9_-]{43}$/);
    expect(first).not.toContain("google-user-123");
  });

  it("changes the subject when Provider user ID changes", () => {
    const service = new OpaqueSubjectService(config);

    expect(service.derive("google", "user-a")).not.toBe(
      service.derive("google", "user-b"),
    );
  });

  it.each([null, "not-base64url", Buffer.alloc(31).toString("base64url")])(
    "rejects an invalid derivation secret",
    (subjectDerivationSecret) => {
      const service = new OpaqueSubjectService({
        subjectDerivationSecret,
      } as AppConfigService);

      expect(() =>
        service.derive("google", "google-user-123"),
      ).toThrow(AuthConfigurationException);
    },
  );
});
