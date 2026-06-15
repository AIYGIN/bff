import { deriveOpaqueSubject } from "./opaque-subject";

describe("deriveOpaqueSubject", () => {
  const secret = Buffer.alloc(32, 3).toString("base64url");

  it("derives a stable opaque subject without exposing Provider ID", () => {
    const first = deriveOpaqueSubject(
      "google",
      "google-user-123",
      secret,
    );
    const second = deriveOpaqueSubject(
      "google",
      "google-user-123",
      secret,
    );

    expect(first).toBe(second);
    expect(first).toMatch(/^usr_v1_[A-Za-z0-9_-]{43}$/);
    expect(first).not.toContain("google-user-123");
  });

  it("changes the subject when Provider user ID changes", () => {
    expect(deriveOpaqueSubject("google", "user-a", secret)).not.toBe(
      deriveOpaqueSubject("google", "user-b", secret),
    );
  });

  it.each(["not-base64url", Buffer.alloc(31).toString("base64url")])(
    "rejects an invalid derivation secret",
    (invalidSecret) => {
      expect(() =>
        deriveOpaqueSubject("google", "google-user-123", invalidSecret),
      ).toThrow("Invalid subject derivation secret");
    },
  );
});
