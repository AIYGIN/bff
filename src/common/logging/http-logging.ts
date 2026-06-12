import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Options, ReqId } from "pino-http";

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;

const firstHeaderValue = (
  value: string | string[] | undefined,
): string | undefined => (Array.isArray(value) ? value[0] : value);

const pathWithoutQuery = (request: IncomingMessage): string => {
  const url = request.url ?? "/";
  return new URL(url, "http://localhost").pathname;
};

const requestId = (request: IncomingMessage): string =>
  String(request.id ?? "");

const accessLogFields = (
  request: IncomingMessage,
  response: ServerResponse,
  duration: unknown,
) => ({
  requestId: requestId(request),
  method: request.method,
  path: pathWithoutQuery(request),
  status: response.statusCode,
  duration,
  ip: request.socket.remoteAddress,
  userAgent: request.headers["user-agent"],
});

export const createHttpLoggerOptions = (
  level: string,
): Options<IncomingMessage, ServerResponse> => ({
  level,
  customAttributeKeys: {
    reqId: "requestId",
  },
  serializers: {
    req: () => undefined,
  },
  genReqId: (request, response): ReqId => {
    const incomingRequestId = firstHeaderValue(
      request.headers["x-request-id"],
    );
    const id =
      incomingRequestId && REQUEST_ID_PATTERN.test(incomingRequestId)
        ? incomingRequestId
        : randomUUID();

    response.setHeader("x-request-id", id);
    return id;
  },
  customLogLevel: (_request, response, error) => {
    if (error || response.statusCode >= 500) {
      return "error";
    }
    if (response.statusCode >= 400) {
      return "warn";
    }
    return "info";
  },
  customSuccessObject: (request, response, value) =>
    accessLogFields(request, response, value.responseTime),
  customErrorObject: (request, response, _error, value) =>
    accessLogFields(request, response, value.responseTime),
  customSuccessMessage: () => "request completed",
  customErrorMessage: () => "request failed",
  quietReqLogger: true,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "authorization",
      "cookie",
      "password",
      "token",
      "accessToken",
      "refreshToken",
    ],
    censor: "[Redacted]",
  },
});
