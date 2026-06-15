export class GoogleAuthorizationEntityRequest {
  state: string;
  codeChallenge: string;

  constructor(args: GoogleAuthorizationEntityRequest) {
    Object.assign(this, args);
  }
}

export class GoogleAuthorizationEntityResponse {
  authorizationUrl: string;

  constructor(args: GoogleAuthorizationEntityResponse) {
    Object.assign(this, args);
  }
}

export class GoogleTokenExchangeEntityRequest {
  code: string;
  codeVerifier: string;

  constructor(args: GoogleTokenExchangeEntityRequest) {
    Object.assign(this, args);
  }
}

export class GoogleTokenEntityResponse {
  accessToken: string;

  constructor(args: GoogleTokenEntityResponse) {
    Object.assign(this, args);
  }
}

export class GoogleUserInfoEntityRequest {
  accessToken: string;

  constructor(args: GoogleUserInfoEntityRequest) {
    Object.assign(this, args);
  }
}

export class GoogleUserInfoEntityResponse {
  providerUserId: string;
  displayName: string;
  profileImageUrl?: string;

  constructor(args: GoogleUserInfoEntityResponse) {
    Object.assign(this, args);
  }
}
