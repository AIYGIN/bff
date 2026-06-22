import { applyDecorators } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiFoundResponse,
  ApiInternalServerErrorResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { AuthMeResponseDto } from "../dto/auth/auth-me-response.dto";
import { ErrorResponseSchema } from "./schemas/error-response.schema";

const redirectHeaders = {
  Location: {
    description: "Redirect URL",
    schema: {
      type: "string",
      format: "uri",
    },
  },
  "Set-Cookie": {
    description: "Cookie to set or clear",
    schema: {
      type: "string",
    },
  },
} as const;

export const GoogleLoginDocs = () =>
  applyDecorators(
    ApiTags("auth"),
    ApiOperation({
      summary: "Google ログイン開始",
      description:
        "OAuth state と PKCE 情報を一時 Cookie に保存し、Google 認可画面へリダイレクトする。",
    }),
    ApiFoundResponse({
      description: "Google 認可画面へリダイレクト",
      headers: redirectHeaders,
    }),
    ApiInternalServerErrorResponse({
      description: "サーバーエラー",
      type: ErrorResponseSchema,
    }),
  );

export const GoogleCallbackDocs = () =>
  applyDecorators(
    ApiTags("auth"),
    ApiOperation({
      summary: "Google OAuth コールバック",
      description:
        "state と code または error のどちらか一方を受け取る。成功時は BFF access token Cookie を設定して Frontend へリダイレクトし、失敗時は Provider 詳細を公開せず失敗 URL へリダイレクトする。",
    }),
    ApiQuery({
      name: "code",
      description: "成功時に指定する Google authorization code。error と同時指定不可。",
      required: false,
      type: String,
    }),
    ApiQuery({
      name: "state",
      description: "OAuth state",
      required: true,
      type: String,
    }),
    ApiQuery({
      name: "error",
      description: "失敗時に指定する Google OAuth error。code と同時指定不可。",
      required: false,
      type: String,
    }),
    ApiFoundResponse({
      description: "Frontend へリダイレクト",
      headers: redirectHeaders,
    }),
    ApiBadRequestResponse({
      description: "不正な callback query",
      type: ErrorResponseSchema,
    }),
    ApiInternalServerErrorResponse({
      description: "サーバーエラー",
      type: ErrorResponseSchema,
    }),
  );

export const GetAuthMeDocs = () =>
  applyDecorators(
    ApiTags("auth"),
    ApiOperation({
      summary: "認証ユーザー取得",
      description:
        "BFF access token Cookie を検証し、識別子を含まない表示用ユーザー情報を返す。未認証時はリダイレクトせず 401 を返す。",
    }),
    ApiCookieAuth("accessTokenCookie"),
    ApiOkResponse({
      description: "認証済みユーザーの表示情報",
      type: AuthMeResponseDto,
    }),
    ApiUnauthorizedResponse({
      description: "未認証",
      type: ErrorResponseSchema,
    }),
    ApiInternalServerErrorResponse({
      description: "サーバーエラー",
      type: ErrorResponseSchema,
    }),
  );

export const LogoutDocs = () =>
  applyDecorators(
    ApiTags("auth"),
    ApiOperation({
      summary: "ログアウト",
      description:
        "BFF access token Cookie を削除する。サーバー側 session や token blacklist は作成しない。",
    }),
    ApiNoContentResponse({
      description: "ログアウト成功",
      headers: {
        "Set-Cookie": redirectHeaders["Set-Cookie"],
      },
    }),
    ApiInternalServerErrorResponse({
      description: "サーバーエラー",
      type: ErrorResponseSchema,
    }),
  );
