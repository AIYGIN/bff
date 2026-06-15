import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { CurrentUser as CurrentUserDecorator } from "../../guard/current-user.decorator";
import type { CurrentUser } from "../../guard/current-user";
import { JwtAuthGuard } from "../../guard/jwt-auth.guard";
import {
  GetAuthMeDocs,
  GoogleCallbackDocs,
  GoogleLoginDocs,
  LogoutDocs,
} from "../../docs/auth.docs";
import { AuthMeResponseDto } from "../../dto/auth/auth-me-response.dto";
import { GoogleCallbackQueryDto } from "../../dto/auth/google-callback-query.dto";
import {
  AuthService,
  type HandleGoogleCallbackResult,
} from "../../service/auth/auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("google/login")
  @GoogleLoginDocs()
  async googleLogin(@Res() response: Response): Promise<void> {
    const result = await this.authService.beginGoogleLogin();
    response.cookie(
      "google_oauth_state",
      result.stateCookieValue,
      this.authService.oauthStateCookieOptions(),
    );
    response.redirect(result.authorizationUrl);
  }

  @Get("google/callback")
  @GoogleCallbackDocs()
  async googleCallback(
    @Query() query: GoogleCallbackQueryDto,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    let result: HandleGoogleCallbackResult;
    try {
      result = await this.authService.handleGoogleCallback({
        code: query.code,
        cookieHeader: request.headers.cookie,
        state: query.state,
        error: query.error,
      });
    } catch (error) {
      response.clearCookie(
        "google_oauth_state",
        this.authService.cookieClearOptions(),
      );
      throw error;
    }

    response.clearCookie(
      "google_oauth_state",
      this.authService.cookieClearOptions(),
    );
    if (result.kind === "success") {
      response.cookie(
        "access_token",
        result.accessToken,
        this.authService.accessTokenCookieOptions(),
      );
    }
    response.redirect(result.redirectUrl);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @GetAuthMeDocs()
  getMe(
    @CurrentUserDecorator() currentUser: CurrentUser,
  ): AuthMeResponseDto {
    return this.authService.getMe(currentUser);
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  @LogoutDocs()
  logout(@Res({ passthrough: true }) response: Response): void {
    response.clearCookie(
      "access_token",
      this.authService.cookieClearOptions(),
    );
  }
}
