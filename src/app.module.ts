import { Module } from "@nestjs/common";
import { TodoModule } from "./controller/todo/todo.module";
import { UserModule } from "./controller/user/user.module";

@Module({
  imports: [UserModule, TodoModule],
})
export class AppModule {}
