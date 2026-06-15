export class GoogleOAuthRejectedException extends Error {
  constructor(options?: ErrorOptions) {
    super("Google OAuth request was rejected", options);
    this.name = GoogleOAuthRejectedException.name;
  }
}
