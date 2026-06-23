import { Module } from "@nestjs/common";
import { SupabaseModule } from "../../common/supabase/supabase.module";
import { AuthModule } from "../auth/auth.module";
import { TodoResource } from "../../resource/todo/todo.resource";
import { TodoService } from "../../service/todo/todo.service";
import { TodoController } from "./todo.controller";

@Module({
  imports: [AuthModule, SupabaseModule],
  controllers: [TodoController],
  providers: [TodoService, TodoResource],
})
export class TodoModule {}
