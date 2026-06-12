import { validateEnvironment } from "./environment";

describe("validateEnvironment", () => {
  it("applies development defaults", () => {
    expect(validateEnvironment({})).toEqual({
      NODE_ENV: "development",
      PORT: 3001,
      CORS_ORIGINS: ["http://localhost:3000"],
      LOG_LEVEL: "debug",
      USER_API_BASE_URL: null,
    });
  });

  it("converts configured values to typed values", () => {
    expect(
      validateEnvironment({
        NODE_ENV: "production",
        PORT: "8080",
        CORS_ORIGIN: "https://app.example.com, https://admin.example.com ",
        LOG_LEVEL: "warn",
        USER_API_BASE_URL: "https://users.example.com",
      }),
    ).toEqual({
      NODE_ENV: "production",
      PORT: 8080,
      CORS_ORIGINS: [
        "https://app.example.com",
        "https://admin.example.com",
      ],
      LOG_LEVEL: "warn",
      USER_API_BASE_URL: "https://users.example.com",
    });
  });

  it.each([
    [{ NODE_ENV: "staging" }, "NODE_ENV"],
    [{ PORT: "0" }, "PORT"],
    [{ PORT: "65536" }, "PORT"],
    [{ PORT: "not-a-number" }, "PORT"],
    [{ CORS_ORIGIN: "not-a-url" }, "CORS_ORIGIN"],
    [{ LOG_LEVEL: "verbose" }, "LOG_LEVEL"],
    [{ USER_API_BASE_URL: "not-a-url" }, "USER_API_BASE_URL"],
  ])("rejects invalid configuration: %p", (environment, key) => {
    expect(() => validateEnvironment(environment)).toThrow(key);
  });

  it("requires USER_API_BASE_URL in production", () => {
    expect(() =>
      validateEnvironment({ NODE_ENV: "production" }),
    ).toThrow("USER_API_BASE_URL");
  });

  it("uses info as the production log level default", () => {
    expect(
      validateEnvironment({
        NODE_ENV: "production",
        USER_API_BASE_URL: "https://users.example.com",
      }).LOG_LEVEL,
    ).toBe("info");
  });
});
