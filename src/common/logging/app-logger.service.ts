import { Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { sanitizeLogValue } from "./log-sanitizer";

export type LogFields = Record<string, unknown>;
export type LogMessage = string | Error;

export interface ContextLogger {
  debug(message: LogMessage, fields?: LogFields): void;
  info(message: LogMessage, fields?: LogFields): void;
  warn(message: LogMessage, fields?: LogFields): void;
  error(message: LogMessage, fields?: LogFields): void;
}

const RESERVED_LOG_FIELDS = new Set([
  "context",
  "hostname",
  "level",
  "msg",
  "pid",
  "requestId",
  "time",
]);

const sanitizedLogFields = (fields: LogFields): LogFields => {
  const sanitized = sanitizeLogValue(fields);
  if (
    sanitized === null ||
    typeof sanitized !== "object" ||
    Array.isArray(sanitized)
  ) {
    return { fields: sanitized };
  }

  return Object.fromEntries(
    Object.entries(sanitized).filter(
      ([key]) => !RESERVED_LOG_FIELDS.has(key),
    ),
  );
};

@Injectable()
export class AppLogger {
  constructor(private readonly pinoLogger: PinoLogger) {}

  withContext(context: string): ContextLogger {
    const log = (
      level: "debug" | "info" | "warn" | "error",
      message: LogMessage,
      fields: LogFields = {},
    ): void => {
      const error = message instanceof Error ? message : undefined;
      const text =
        typeof message === "string" ? message : message.message;
      const serializedFields = sanitizedLogFields(fields);
      const bindings = {
        ...serializedFields,
        context,
        ...(error ? { error: sanitizeLogValue(error) } : {}),
      };

      this.pinoLogger[level](bindings, text);
    };

    return {
      debug: (message, fields) => log("debug", message, fields),
      info: (message, fields) => log("info", message, fields),
      warn: (message, fields) => log("warn", message, fields),
      error: (message, fields) => log("error", message, fields),
    };
  }
}
