import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { AppConfigModule } from "./common/config/app-config.module";
import { AllExceptionsFilter } from "./common/logging/all-exceptions.filter";
import { LoggingModule } from "./common/logging/logging.module";
import { AuthModule } from "./controller/auth/auth.module";
import { TodoModule } from "./controller/todo/todo.module";
import { UserModule } from "./controller/user/user.module";

@Module({
  imports: [
    AppConfigModule,
    LoggingModule,
    UserModule,
    TodoModule,
    AuthModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
