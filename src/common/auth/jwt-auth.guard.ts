import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { JwtTokenService } from "../../services/auth/jwt-token.service";
import { readCookie } from "./cookie";
import type { CurrentUser } from "./current-user";

export type AuthenticatedRequest = Request & {
  currentUser?: CurrentUser;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtTokenService: JwtTokenService) {}

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

    request.currentUser =
      await this.jwtTokenService.verifyAccessToken(token);
    return true;
  }
}
