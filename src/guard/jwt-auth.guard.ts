import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { AuthService } from "../service/auth/auth.service";
import { readCookie } from "../utility/auth/cookie";
import type { CurrentUser } from "./current-user";

export type AuthenticatedRequest = Request & {
  currentUser?: CurrentUser;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request =
      context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = readCookie(
      request.headers?.cookie,
      "access_token",
    );
    if (!token) {
      throw new UnauthorizedException("Unauthorized");
    }

    try {
      request.currentUser =
        await this.authService.verifyAccessToken(token);
      return true;
    } catch {
      throw new UnauthorizedException("Unauthorized");
    }
  }
}
