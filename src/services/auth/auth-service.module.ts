import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { ExternalHttpModule } from "../../lib/http/external-http.module";
import { GoogleOAuthResource } from "../../resources/auth/google-oauth.resource";
import { AuthCookieService } from "./auth-cookie.service";
import { AuthService } from "./auth.service";
import { JwtTokenService } from "./jwt-token.service";
import { OAuthStateService } from "./oauth-state.service";
import { OpaqueSubjectService } from "./opaque-subject.service";

@Module({
  imports: [ExternalHttpModule, JwtModule.register({})],
  providers: [
    AuthService,
    AuthCookieService,
    GoogleOAuthResource,
    OAuthStateService,
    OpaqueSubjectService,
    JwtTokenService,
    JwtAuthGuard,
  ],
  exports: [
    AuthService,
    AuthCookieService,
    JwtTokenService,
    JwtAuthGuard,
  ],
})
export class AuthServiceModule {}
