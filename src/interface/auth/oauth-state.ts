export interface OAuthState {
  state: string;
  codeChallenge: string;
  cookieValue: string;
}

export interface VerifiedOAuthState {
  state: string;
  codeVerifier: string;
}
