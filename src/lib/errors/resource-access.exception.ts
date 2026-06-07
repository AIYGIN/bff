import { ServiceUnavailableException } from "@nestjs/common";

export class ResourceAccessException extends ServiceUnavailableException {
  constructor(resourceName: string, options?: ErrorOptions) {
    super(`Failed to access ${resourceName}`, options);
  }
}
