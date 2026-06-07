import { Module } from "@nestjs/common";
import { UserModule } from "./controller/user.module";

@Module({
  imports: [UserModule],
})
export class AppModule {}
