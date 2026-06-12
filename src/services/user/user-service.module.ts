import { Module } from "@nestjs/common";
import { ExternalHttpModule } from "../../lib/http/external-http.module";
import { USER_API_BASE_URL } from "../../resources/user/user-resource.constants";
import { UserResource } from "../../resources/user/user.resource";
import { UserService } from "./user.service";

@Module({
  imports: [ExternalHttpModule],
  providers: [
    UserService,
    UserResource,
    {
      provide: USER_API_BASE_URL,
      useFactory: () => process.env.USER_API_BASE_URL ?? null,
    },
  ],
  exports: [UserService],
})
export class UserServiceModule {}
