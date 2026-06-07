export class GetUserEntityRequest {
  userId: string;

  constructor(args: GetUserEntityRequest) {
    Object.assign(this, args);
  }
}

export class GetUserEntityResponse {
  id: string;
  name: string;

  constructor(args: GetUserEntityResponse) {
    Object.assign(this, args);
  }
}
