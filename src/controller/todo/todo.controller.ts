import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  CreateTodoDocs,
  DeleteTodoDocs,
  GetTodoDocs,
  GetTodosDocs,
  UpdateTodoDocs,
} from "../../docs/todos.docs";
import { CreateTodoRequestDto } from "../../dto/todo/create-todo-request.dto";
import { TodoDto } from "../../dto/todo/todo.dto";
import { UpdateTodoRequestDto } from "../../dto/todo/update-todo-request.dto";
import { CurrentUser } from "../../guard/current-user.decorator";
import type { CurrentUser as CurrentUserValue } from "../../guard/current-user";
import { JwtAuthGuard } from "../../guard/jwt-auth.guard";
import { TodoService } from "../../service/todo/todo.service";

@Controller("todos")
@UseGuards(JwtAuthGuard)
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  @Get()
  @GetTodosDocs()
  getTodos(@CurrentUser() currentUser: CurrentUserValue): Promise<TodoDto[]> {
    return this.todoService.getTodos(currentUser.subject);
  }

  @Get(":id")
  @GetTodoDocs()
  getTodo(
    @Param("id") id: string,
    @CurrentUser() currentUser: CurrentUserValue,
  ): Promise<TodoDto> {
    return this.todoService.getTodo(id, currentUser.subject);
  }

  @Post()
  @CreateTodoDocs()
  createTodo(
    @Body() request: CreateTodoRequestDto,
    @CurrentUser() currentUser: CurrentUserValue,
  ): Promise<TodoDto> {
    return this.todoService.createTodo(request, currentUser.subject);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @DeleteTodoDocs()
  async deleteTodo(
    @Param("id") id: string,
    @CurrentUser() currentUser: CurrentUserValue,
  ): Promise<void> {
    await this.todoService.deleteTodo(id, currentUser.subject);
  }

  @Patch(":id")
  @UpdateTodoDocs()
  updateTodo(
    @Param("id") id: string,
    @Body() request: UpdateTodoRequestDto,
    @CurrentUser() currentUser: CurrentUserValue,
  ): Promise<TodoDto> {
    return this.todoService.updateTodo(id, request, currentUser.subject);
  }
}
