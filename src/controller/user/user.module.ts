import { Module } from "@nestjs/common";
import { AppConfigService } from "../../common/config/app-config.service";
import { ExternalHttpModule } from "../../common/http/external-http.module";
import { USER_API_BASE_URL } from "../../resource/user/user-resource.constants";
import { UserResource } from "../../resource/user/user.resource";
import { UserService } from "../../service/user/user.service";
import { UserController } from "./user.controller";

@Module({
  imports: [ExternalHttpModule],
  controllers: [UserController],
  providers: [
    UserService,
    UserResource,
    {
      provide: USER_API_BASE_URL,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => config.userApiBaseUrl,
    },
  ],
})
export class UserModule {}
