import type { PinoLogger } from "nestjs-pino";
import { AppLogger } from "./app-logger.service";

describe("AppLogger", () => {
  it("adds context and structured fields", () => {
    const info = jest.fn();
    const logger = new AppLogger({ info } as unknown as PinoLogger);

    logger.withContext("UserService").info("user loaded", {
      userId: "user_123",
    });

    expect(info).toHaveBeenCalledWith(
      {
        context: "UserService",
        userId: "user_123",
      },
      "user loaded",
    );
  });

  it("serializes Error name, message, stack, and cause", () => {
    const error = jest.fn();
    const logger = new AppLogger({ error } as unknown as PinoLogger);
    const cause = new Error("socket closed");
    const failure = new Error("request failed", { cause });

    logger.withContext("UserResource").error(failure, {
      resource: "User API",
    });

    expect(error).toHaveBeenCalledWith(
      expect.objectContaining({
        context: "UserResource",
        resource: "User API",
        error: expect.objectContaining({
          name: "Error",
          message: "request failed",
          stack: expect.any(String),
          cause: expect.objectContaining({
            name: "Error",
            message: "socket closed",
          }),
        }),
      }),
      "request failed",
    );
  });

  it("redacts sensitive fields recursively", () => {
    const warn = jest.fn();
    const logger = new AppLogger({ warn } as unknown as PinoLogger);

    logger.withContext("AuthService").warn("invalid credentials", {
      authorization: "Bearer secret",
      nested: {
        password: "secret",
        token: "secret",
        safe: "visible",
      },
    });

    expect(warn).toHaveBeenCalledWith(
      {
        context: "AuthService",
        authorization: "[Redacted]",
        nested: {
          password: "[Redacted]",
          token: "[Redacted]",
          safe: "visible",
        },
      },
      "invalid credentials",
    );
  });

  it("does not mutate fields passed by the caller", () => {
    const info = jest.fn();
    const logger = new AppLogger({ info } as unknown as PinoLogger);
    const fields = {
      nested: {
        password: "secret",
      },
    };

    logger.withContext("AuthService").info("auth checked", fields);

    expect(fields).toEqual({
      nested: {
        password: "secret",
      },
    });
  });

  it("does not allow fields to override the logger context", () => {
    const info = jest.fn();
    const logger = new AppLogger({ info } as unknown as PinoLogger);

    logger.withContext("TrustedContext").info("message", {
      context: "SpoofedContext",
      requestId: "spoofed-request-id",
      level: 60,
    });

    expect(info).toHaveBeenCalledWith(
      {
        context: "TrustedContext",
      },
      "message",
    );
  });
});
