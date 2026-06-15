import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ExternalHttpModule } from "../../common/http/external-http.module";
import { JwtAuthGuard } from "../../guard/jwt-auth.guard";
import { GoogleOAuthResource } from "../../resource/auth/google-oauth.resource";
import { AuthService } from "../../service/auth/auth.service";
import { AuthController } from "./auth.controller";

@Module({
  imports: [ExternalHttpModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, GoogleOAuthResource, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
