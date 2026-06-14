export const REDACTED_LOG_VALUE = "[Redacted]";

const CIRCULAR_LOG_VALUE = "[Circular]";
const MAX_DEPTH_LOG_VALUE = "[MaxDepth]";
const UNSERIALIZABLE_LOG_VALUE = "[Unserializable]";
const TRUNCATED_LOG_VALUE = "[Truncated]";

const EXACT_SENSITIVE_KEYS = new Set([
  "authorization",
  "proxyauthorization",
  "cookie",
  "setcookie",
  "password",
  "passwd",
  "passphrase",
  "secret",
  "clientsecret",
  "token",
  "accesstoken",
  "refreshtoken",
  "idtoken",
  "apikey",
  "xapikey",
]);

export interface LogSanitizerOptions {
  maxDepth?: number;
  maxEntries?: number;
  maxStringLength?: number;
}

const normalizedKey = (key: string): string =>
  key.toLowerCase().replace(/[^a-z0-9]/g, "");

const isSensitiveKey = (key: string): boolean => {
  const normalized = normalizedKey(key);
  return (
    EXACT_SENSITIVE_KEYS.has(normalized) ||
    normalized.startsWith("password") ||
    normalized.endsWith("secret") ||
    normalized.endsWith("token") ||
    normalized.endsWith("apikey")
  );
};

const readProperty = (
  value: Record<string, unknown>,
  key: string,
): unknown => {
  try {
    return value[key];
  } catch {
    return UNSERIALIZABLE_LOG_VALUE;
  }
};

export const sanitizeLogValue = (
  value: unknown,
  options: LogSanitizerOptions = {},
): unknown => {
  const maxDepth = options.maxDepth ?? 8;
  const maxEntries = options.maxEntries ?? 100;
  const maxStringLength = options.maxStringLength ?? 4_096;
  const ancestors = new WeakSet<object>();

  const sanitize = (current: unknown, depth: number): unknown => {
    if (
      current === null ||
      typeof current === "number" ||
      typeof current === "boolean" ||
      current === undefined
    ) {
      return current;
    }
    if (typeof current === "string") {
      return current.length > maxStringLength
        ? `${current.slice(0, maxStringLength)}...${TRUNCATED_LOG_VALUE}`
        : current;
    }
    if (typeof current === "bigint") {
      return current.toString();
    }
    if (typeof current === "symbol" || typeof current === "function") {
      return String(current);
    }
    if (current instanceof Date) {
      return Number.isNaN(current.getTime())
        ? "Invalid Date"
        : current.toISOString();
    }
    if (current instanceof URL) {
      return current.toString();
    }
    if (Buffer.isBuffer(current)) {
      return `[Buffer ${current.length} bytes]`;
    }
    if (depth >= maxDepth) {
      return MAX_DEPTH_LOG_VALUE;
    }
    if (ancestors.has(current)) {
      return CIRCULAR_LOG_VALUE;
    }
    ancestors.add(current);

    try {
      if (current instanceof Error) {
        const errorFields: Record<string, unknown> = {
          name: current.name,
          message: sanitize(current.message, depth + 1),
          stack: sanitize(current.stack, depth + 1),
        };
        if (current.cause !== undefined) {
          errorFields.cause = sanitize(current.cause, depth + 1);
        }
        for (const key of Object.keys(current).slice(0, maxEntries)) {
          if (!(key in errorFields)) {
            errorFields[key] = isSensitiveKey(key)
              ? REDACTED_LOG_VALUE
              : sanitize(
                  readProperty(
                    current as unknown as Record<string, unknown>,
                    key,
                  ),
                  depth + 1,
                );
          }
        }
        return errorFields;
      }

      if (Array.isArray(current)) {
        const values = current
          .slice(0, maxEntries)
          .map((item) => sanitize(item, depth + 1));
        if (current.length > maxEntries) {
          values.push(TRUNCATED_LOG_VALUE);
        }
        return values;
      }

      if (current instanceof Map) {
        return Object.fromEntries(
          [...current.entries()].slice(0, maxEntries).map(([key, item]) => {
            const stringKey = String(key);
            return [
              stringKey,
              isSensitiveKey(stringKey)
                ? REDACTED_LOG_VALUE
                : sanitize(item, depth + 1),
            ];
          }),
        );
      }

      if (current instanceof Set) {
        return [...current.values()]
          .slice(0, maxEntries)
          .map((item) => sanitize(item, depth + 1));
      }

      const record = current as Record<string, unknown>;
      const keys = Object.keys(record);
      const sanitized = Object.fromEntries(
        keys.slice(0, maxEntries).map((key) => [
          key,
          isSensitiveKey(key)
            ? REDACTED_LOG_VALUE
            : sanitize(readProperty(record, key), depth + 1),
        ]),
      );
      if (keys.length > maxEntries) {
        sanitized._truncated = TRUNCATED_LOG_VALUE;
      }
      return sanitized;
    } finally {
      ancestors.delete(current);
    }
  };

  try {
    return sanitize(value, 0);
  } catch {
    return UNSERIALIZABLE_LOG_VALUE;
  }
};
