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
import { CurrentUser as CurrentUserDecorator } from "../../common/auth/current-user.decorator";
import type { CurrentUser } from "../../common/auth/current-user";
import { readCookie } from "../../common/auth/cookie";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import {
  GetAuthMeDocs,
  GoogleCallbackDocs,
  GoogleLoginDocs,
  LogoutDocs,
} from "../../docs/auth.docs";
import { AuthMeResponseDto } from "../../interface/dto/auth/auth-me-response.dto";
import { GoogleCallbackQueryDto } from "../../interface/dto/auth/google-callback-query.dto";
import { AuthCookieService } from "../../services/auth/auth-cookie.service";
import {
  AuthService,
  type HandleGoogleCallbackResult,
} from "../../services/auth/auth.service";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authCookieService: AuthCookieService,
  ) {}

  @Get("google/login")
  @GoogleLoginDocs()
  async googleLogin(@Res() response: Response): Promise<void> {
    const result = await this.authService.beginGoogleLogin();
    response.cookie(
      "google_oauth_state",
      result.stateCookieValue,
      this.authCookieService.oauthStateOptions(),
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
        state: query.state,
        error: query.error,
        stateCookieValue: readCookie(
          request.headers.cookie,
          "google_oauth_state",
        ),
      });
    } catch (error) {
      response.clearCookie(
        "google_oauth_state",
        this.authCookieService.clearOptions(),
      );
      throw error;
    }

    response.clearCookie(
      "google_oauth_state",
      this.authCookieService.clearOptions(),
    );
    if (result.kind === "success") {
      response.cookie(
        "access_token",
        result.accessToken,
        this.authCookieService.accessTokenOptions(),
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
      this.authCookieService.clearOptions(),
    );
  }
}
