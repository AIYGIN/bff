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
} from "@nestjs/common";
import {
  CreateTodoDocs,
  DeleteTodoDocs,
  GetTodosDocs,
  UpdateTodoDocs,
} from "../../docs/todos.docs";
import { CreateTodoRequestDto } from "../../dto/todo/create-todo-request.dto";
import { TodoDto } from "../../dto/todo/todo.dto";
import { UpdateTodoRequestDto } from "../../dto/todo/update-todo-request.dto";
import { TodoService } from "../../service/todo/todo.service";

@Controller("todos")
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  @Get()
  @GetTodosDocs()
  getTodos(): TodoDto[] {
    return this.todoService.getTodos();
  }

  @Post()
  @CreateTodoDocs()
  createTodo(@Body() request: CreateTodoRequestDto): TodoDto {
    return this.todoService.createTodo(request);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @DeleteTodoDocs()
  deleteTodo(@Param("id") id: string): void {
    this.todoService.deleteTodo(id);
  }

  @Patch(":id")
  @UpdateTodoDocs()
  updateTodo(
    @Param("id") id: string,
    @Body() request: UpdateTodoRequestDto,
  ): TodoDto {
    return this.todoService.updateTodo(id, request);
  }
}
