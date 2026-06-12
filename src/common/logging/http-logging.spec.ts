import type { IncomingMessage, ServerResponse } from "node:http";
import { createHttpLoggerOptions } from "./http-logging";

describe("createHttpLoggerOptions", () => {
  const createRequest = (
    requestId?: string,
  ): IncomingMessage =>
    ({
      headers: {
        "x-request-id": requestId,
        "user-agent": "test-agent",
      },
      method: "GET",
      url: "/users/user_123?token=secret",
      socket: { remoteAddress: "127.0.0.1" },
      id: "",
    }) as unknown as IncomingMessage;

  const createResponse = (statusCode = 200): ServerResponse =>
    ({
      statusCode,
      setHeader: jest.fn(),
    }) as unknown as ServerResponse;

  it("reuses a safe request id and writes it to the response", () => {
    const options = createHttpLoggerOptions("debug");
    const request = createRequest("request-123");
    const response = createResponse();

    expect(options.genReqId?.(request, response)).toBe("request-123");
    expect(response.setHeader).toHaveBeenCalledWith(
      "x-request-id",
      "request-123",
    );
  });

  it("replaces an unsafe request id with a UUID", () => {
    const options = createHttpLoggerOptions("debug");
    const response = createResponse();

    const id = options.genReqId?.(
      createRequest("unsafe request id"),
      response,
    );

    expect(id).toEqual(expect.stringMatching(/^[0-9a-f-]{36}$/));
  });

  it.each([
    [200, "info"],
    [302, "info"],
    [400, "warn"],
    [404, "warn"],
    [500, "error"],
  ])("maps status %i to %s", (status, expectedLevel) => {
    const options = createHttpLoggerOptions("debug");
    expect(
      options.customLogLevel?.(
        createRequest(),
        createResponse(status),
      ),
    ).toBe(expectedLevel);
  });

  it("logs only the query-free access path and approved fields", () => {
    const options = createHttpLoggerOptions("debug");
    const request = createRequest();
    request.id = "request-123";

    expect(
      options.customSuccessObject?.(
        request,
        createResponse(),
        { responseTime: 12, req: { body: "secret" } },
      ),
    ).toEqual({
      requestId: "request-123",
      method: "GET",
      path: "/users/user_123",
      status: 200,
      duration: 12,
      ip: "127.0.0.1",
      userAgent: "test-agent",
    });
  });
});
