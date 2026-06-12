import { Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";

export type LogFields = Record<string, unknown>;
export type LogMessage = string | Error;

export interface ContextLogger {
  debug(message: LogMessage, fields?: LogFields): void;
  info(message: LogMessage, fields?: LogFields): void;
  warn(message: LogMessage, fields?: LogFields): void;
  error(message: LogMessage, fields?: LogFields): void;
}

const REDACTED = "[Redacted]";
const SENSITIVE_KEY_PATTERN =
  /authorization|cookie|password|passphrase|secret|token|api[-_]?key/i;

const serializeValue = (
  value: unknown,
  seen = new WeakSet<object>(),
): unknown => {
  if (value instanceof Error) {
    if (seen.has(value)) {
      return "[Circular]";
    }
    seen.add(value);

    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
      cause:
        value.cause === undefined
          ? undefined
          : serializeValue(value.cause, seen),
    };
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeValue(item, seen));
  }

  if (value !== null && typeof value === "object") {
    if (seen.has(value)) {
      return "[Circular]";
    }
    seen.add(value);

    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        SENSITIVE_KEY_PATTERN.test(key)
          ? REDACTED
          : serializeValue(item, seen),
      ]),
    );
  }

  return value;
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
      const serializedFields = serializeValue(fields) as LogFields;
      const bindings = {
        context,
        ...serializedFields,
        ...(error ? { error: serializeValue(error) } : {}),
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
