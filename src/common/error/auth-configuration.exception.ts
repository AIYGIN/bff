import { InternalServerErrorException } from "@nestjs/common";

export class AuthConfigurationException extends InternalServerErrorException {
  constructor(key: string) {
    super(`Auth configuration is missing: ${key}`);
  }
}
