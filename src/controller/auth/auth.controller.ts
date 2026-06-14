import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Res,
} from "@nestjs/common";
import type { CookieOptions, Response } from "express";
import {
  GetAuthMeDocs,
  GoogleCallbackDocs,
  GoogleLoginDocs,
  LogoutDocs,
} from "../../docs/auth.docs";
import { AuthMeResponseDto } from "../../interface/dto/auth/auth-me-response.dto";
import { GoogleCallbackQueryDto } from "../../interface/dto/auth/google-callback-query.dto";

const GOOGLE_AUTHORIZATION_URL =
  "https://accounts.google.com/o/oauth2/v2/auth?client_id=mock-google-client-id&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fauth%2Fgoogle%2Fcallback&response_type=code&scope=openid%20profile%20email&state=mock-oauth-state&code_challenge=mock-code-challenge&code_challenge_method=S256";
const AUTH_SUCCESS_URL = "http://localhost:3000/auth/success";
const AUTH_FAILURE_URL = "http://localhost:3000/auth/failure";

const cookieOptions = (): CookieOptions => ({
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  secure: process.env.NODE_ENV === "production",
});

@Controller("auth")
export class AuthController {
  @Get("google/login")
  @GoogleLoginDocs()
  googleLogin(@Res() response: Response): void {
    response.cookie(
      "google_oauth_state",
      "mock-signed-oauth-state-pkce",
      cookieOptions(),
    );
    response.redirect(GOOGLE_AUTHORIZATION_URL);
  }

  @Get("google/callback")
  @GoogleCallbackDocs()
  googleCallback(
    @Query() query: GoogleCallbackQueryDto,
    @Res() response: Response,
  ): void {
    const hasState =
      typeof query.state === "string" && query.state.length > 0;
    const hasCode =
      typeof query.code === "string" && query.code.length > 0;
    const hasError =
      typeof query.error === "string" && query.error.length > 0;

    if (!hasState || hasCode === hasError) {
      throw new BadRequestException("Invalid OAuth callback query");
    }

    if (hasCode) {
      response.cookie(
        "access_token",
        "mock-bff-access-token",
        cookieOptions(),
      );
    }

    response.clearCookie("google_oauth_state", cookieOptions());
    response.redirect(hasCode ? AUTH_SUCCESS_URL : AUTH_FAILURE_URL);
  }

  @Get("me")
  @GetAuthMeDocs()
  getMe(): AuthMeResponseDto {
    return new AuthMeResponseDto({
      displayName: "Sample User",
      profileImageUrl: "https://example.com/profile.jpg",
    });
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  @LogoutDocs()
  logout(@Res({ passthrough: true }) response: Response): void {
    response.clearCookie("access_token", cookieOptions());
  }
}
