import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import type { Request } from "express";
import { AppLogger, type ContextLogger } from "./app-logger.service";

type RequestWithId = Request & { id?: string | number | object };

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger: ContextLogger;

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    appLogger: AppLogger,
  ) {
    this.logger = appLogger.withContext(AllExceptionsFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<RequestWithId>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const fields = {
      requestId: request.id === undefined ? undefined : String(request.id),
      method: request.method,
      path: request.path,
      status,
    };

    if (status >= 500) {
      this.logger.error(
        exception instanceof Error
          ? exception
          : new Error("Unhandled exception", { cause: exception }),
        fields,
      );
    } else {
      this.logger.warn(
        exception instanceof Error ? exception.message : "HTTP exception",
        fields,
      );
    }

    const responseBody =
      exception instanceof HttpException
        ? this.httpExceptionResponse(exception, status)
        : {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: "Internal server error",
          };
    this.httpAdapterHost.httpAdapter.reply(
      context.getResponse(),
      responseBody,
      status,
    );
  }

  private httpExceptionResponse(
    exception: HttpException,
    status: number,
  ): object {
    const response = exception.getResponse();
    return response !== null && typeof response === "object"
      ? response
      : {
          statusCode: status,
          message: response,
        };
  }
}
