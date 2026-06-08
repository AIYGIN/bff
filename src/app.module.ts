import { Module } from "@nestjs/common";
import { TodoModule } from "./controller/todo.module";
import { UserModule } from "./controller/user.module";

@Module({
  imports: [UserModule, TodoModule],
})
export class AppModule {}
