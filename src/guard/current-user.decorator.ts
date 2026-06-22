import {
  createParamDecorator,
  type ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import type { CurrentUser as CurrentUserValue } from "./current-user";
import type { AuthenticatedRequest } from "./jwt-auth.guard";

export const CurrentUser = createParamDecorator(
  (
    _data: unknown,
    context: ExecutionContext,
  ): CurrentUserValue => {
    const request =
      context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (request.currentUser === undefined) {
      throw new UnauthorizedException("Unauthorized");
    }
    return request.currentUser;
  },
);
