process.env.NODE_ENV = "test";
process.env.PORT = "3001";
process.env.CORS_ORIGIN = "http://localhost:3000";
process.env.LOG_LEVEL = "debug";
process.env.OAUTH_STATE_TTL_SECONDS = "600";
process.env.JWT_ACCESS_TTL_SECONDS = "3600";
process.env.GOOGLE_OAUTH_TIMEOUT_MS = "5000";

process.env.GOOGLE_OAUTH_CLIENT_ID = "";
process.env.GOOGLE_OAUTH_CLIENT_SECRET = "";
process.env.GOOGLE_OAUTH_REDIRECT_URI = "";
process.env.AUTH_SUCCESS_REDIRECT_URL = "";
process.env.AUTH_FAILURE_REDIRECT_URL = "";
process.env.OAUTH_STATE_SIGNING_SECRET = "";
process.env.JWT_ACCESS_SECRET = "";
process.env.JWT_ISSUER = "";
process.env.JWT_AUDIENCE = "";
process.env.SUBJECT_DERIVATION_SECRET = "";
