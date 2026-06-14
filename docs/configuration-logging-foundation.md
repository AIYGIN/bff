# Configuration and Logging Foundation

## Purpose

This foundation provides one typed configuration boundary and one structured
logging path for the NestJS BFF. It is designed to fail during startup when
configuration is unsafe, correlate all request-scoped logs, and prevent
sensitive structured fields from reaching stdout.

## Architecture

```txt
process.env / .env
  -> ConfigModule validation
  -> AppConfigService
  -> bootstrap / feature module factories

HTTP request
  -> pino-http request ID and AsyncLocalStorage context
  -> Controller -> Service -> Resource
  -> AppLogger / Nest Logger
  -> root log sanitizer
  -> JSON stdout

exception
  -> AllExceptionsFilter
  -> structured exception log
  -> unchanged Nest HTTP response
  -> access completion log
```

## Configuration Contract

- `NODE_ENV` accepts only `development`, `test`, or `production`.
- `PORT` accepts decimal integers from 1 through 65535.
- `CORS_ORIGIN` is a comma-separated list of HTTP(S) origins.
  Credentials, paths, queries, and fragments are rejected.
- `LOG_LEVEL` accepts Pino levels.
- `USER_API_BASE_URL` accepts an HTTP(S) base URL without credentials, query,
  or fragment. It is required in production.
- Values are parsed once during module startup. Feature code does not read
  `process.env` directly.

## Logging Contract

Application code uses `AppLogger.withContext(name)`. Nest framework logs and
application logs share the same Pino root logger and request context.

Access logs contain:

- `event`
- `requestId`
- `method`
- query-free `path`
- `status`
- `duration`
- `ip`
- truncated `userAgent`

Request body, query values, raw headers, and authentication data are not
included.

## Data Protection

The root Pino hook sanitizes every structured log object, including logs emitted
through Nest's built-in `Logger`. Sensitive keys such as authorization, cookie,
password, secret, API key, and token fields are redacted recursively.

The sanitizer also:

- serializes `Error` including stack and cause
- detects circular references
- preserves shared non-circular references
- limits object depth, collection size, and string length
- summarizes buffers instead of logging their contents
- handles throwing getters without breaking application code

Redaction is defense in depth. Callers must still avoid placing credentials or
personal raw data in log messages.

## Request ID

An incoming `x-request-id` is reused only when it is 1 to 128 safe ASCII
characters. Otherwise a UUID is generated. The value is:

- returned in the `x-request-id` response header
- exposed through CORS
- attached to access, Service, Resource, Nest, and exception logs

## Exception Handling

The DI-managed global filter logs 4xx responses at `warn` and 5xx/unexpected
exceptions at `error`. It preserves existing Nest response bodies.

When a response has already been committed, the filter ends the response
instead of attempting a second write.

## Verification

Unit tests cover configuration parsing, sanitizer behavior, request metadata,
logger behavior, and exception handling. E2E tests cover request correlation,
redaction on actual JSON output, CORS exposure, status-based access levels,
response compatibility, and OpenAPI non-regression.
