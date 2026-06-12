import {
  BadRequestException,
  type ArgumentsHost,
} from "@nestjs/common";
import type { HttpAdapterHost } from "@nestjs/core";
import {
  AppLogger,
  type ContextLogger,
} from "./app-logger.service";
import { AllExceptionsFilter } from "./all-exceptions.filter";

describe("AllExceptionsFilter", () => {
  const createContext = () => {
    const request = {
      id: "request-123",
      method: "GET",
      path: "/users/user_123",
    };
    const response = {};
    const host = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as ArgumentsHost;

    return { host, request, response };
  };

  const createFilter = (headersSent = false) => {
    const logger: ContextLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    const appLogger = {
      withContext: jest.fn().mockReturnValue(logger),
    } as unknown as AppLogger;
    const adapter = {
      isHeadersSent: jest.fn().mockReturnValue(headersSent),
      reply: jest.fn(),
      end: jest.fn(),
    };
    const filter = new AllExceptionsFilter(
      { httpAdapter: adapter } as unknown as HttpAdapterHost,
      appLogger,
    );

    return { filter, logger, adapter };
  };

  it("logs 4xx at warn and preserves the HTTP response body", () => {
    const { filter, logger, adapter } = createFilter();
    const { host, response } = createContext();
    const exception = new BadRequestException({
      statusCode: 400,
      message: ["invalid request"],
      error: "Bad Request",
    });

    filter.catch(exception, host);

    expect(logger.warn).toHaveBeenCalledWith(
      "Bad Request Exception",
      expect.objectContaining({
        requestId: "request-123",
        status: 400,
      }),
    );
    expect(adapter.reply).toHaveBeenCalledWith(
      response,
      exception.getResponse(),
      400,
    );
  });

  it("logs unexpected exceptions with a stack and preserves the standard body", () => {
    const { filter, logger, adapter } = createFilter();
    const { host, response } = createContext();
    const exception = new Error("failed");

    filter.catch(exception, host);

    expect(logger.error).toHaveBeenCalledWith(
      exception,
      expect.objectContaining({
        requestId: "request-123",
        status: 500,
      }),
    );
    expect(adapter.reply).toHaveBeenCalledWith(
      response,
      {
        statusCode: 500,
        message: "Internal server error",
      },
      500,
    );
  });

  it("ends an already committed response instead of replying twice", () => {
    const { filter, adapter } = createFilter(true);
    const { host, response } = createContext();

    filter.catch(new Error("stream failed"), host);

    expect(adapter.reply).not.toHaveBeenCalled();
    expect(adapter.end).toHaveBeenCalledWith(response);
  });
});
