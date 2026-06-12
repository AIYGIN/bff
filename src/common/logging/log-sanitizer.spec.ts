import {
  REDACTED_LOG_VALUE,
  sanitizeLogValue,
} from "./log-sanitizer";

describe("sanitizeLogValue", () => {
  it("redacts sensitive keys without over-redacting safe names", () => {
    expect(
      sanitizeLogValue({
        authorization: "Bearer secret",
        proxyAuthorization: "Basic secret",
        password: "secret",
        access_token: "secret",
        apiKey: "secret",
        tokenCount: 3,
        cookiePolicy: "strict",
      }),
    ).toEqual({
      authorization: REDACTED_LOG_VALUE,
      proxyAuthorization: REDACTED_LOG_VALUE,
      password: REDACTED_LOG_VALUE,
      access_token: REDACTED_LOG_VALUE,
      apiKey: REDACTED_LOG_VALUE,
      tokenCount: 3,
      cookiePolicy: "strict",
    });
  });

  it("serializes Error, Date, URL, bigint, and cause safely", () => {
    const error = new Error("request failed", {
      cause: new Error("socket closed"),
    });

    expect(
      sanitizeLogValue({
        error,
        at: new Date("2026-06-12T00:00:00.000Z"),
        url: new URL("https://example.com/path"),
        count: 10n,
      }),
    ).toEqual({
      error: expect.objectContaining({
        name: "Error",
        message: "request failed",
        stack: expect.any(String),
        cause: expect.objectContaining({
          name: "Error",
          message: "socket closed",
        }),
      }),
      at: "2026-06-12T00:00:00.000Z",
      url: "https://example.com/path",
      count: "10",
    });
  });

  it("handles circular references and throwing getters", () => {
    const value: Record<string, unknown> = {};
    value.self = value;
    Object.defineProperty(value, "broken", {
      enumerable: true,
      get: () => {
        throw new Error("getter failed");
      },
    });

    expect(sanitizeLogValue(value)).toEqual({
      self: "[Circular]",
      broken: "[Unserializable]",
    });
  });

  it("fails closed for objects that reject reflection", () => {
    const value = new Proxy(
      {},
      {
        getPrototypeOf: () => {
          throw new Error("reflection blocked");
        },
      },
    );

    expect(sanitizeLogValue(value)).toBe("[Unserializable]");
  });

  it("preserves shared references that are not circular", () => {
    const shared = { value: "visible" };

    expect(sanitizeLogValue({ first: shared, second: shared })).toEqual({
      first: { value: "visible" },
      second: { value: "visible" },
    });
  });

  it("summarizes binary data and preserves common collection types", () => {
    expect(
      sanitizeLogValue({
        buffer: Buffer.from("secret binary payload"),
        map: new Map([
          ["password", "secret"],
          ["safe", "visible"],
        ]),
        set: new Set(["one", "two"]),
      }),
    ).toEqual({
      buffer: "[Buffer 21 bytes]",
      map: {
        password: REDACTED_LOG_VALUE,
        safe: "visible",
      },
      set: ["one", "two"],
    });
  });

  it("truncates oversized strings", () => {
    expect(
      sanitizeLogValue({ value: "a".repeat(20) }, { maxStringLength: 8 }),
    ).toEqual({
      value: "aaaaaaaa...[Truncated]",
    });
  });

  it("limits excessive depth", () => {
    expect(
      sanitizeLogValue({
        one: {
          two: {
            three: {
              four: "value",
            },
          },
        },
      }, { maxDepth: 2 }),
    ).toEqual({
      one: {
        two: "[MaxDepth]",
      },
    });
  });
});
