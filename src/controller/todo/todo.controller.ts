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
import type { CreateTodoRequestDto } from "../../interface/dto/todo/create-todo-request.dto";
import { TodoDto } from "../../interface/dto/todo/todo.dto";
import type { UpdateTodoRequestDto } from "../../interface/dto/todo/update-todo-request.dto";

@Controller("todos")
export class TodoController {
  @Get()
  @GetTodosDocs()
  getTodos(): TodoDto[] {
    return [
      new TodoDto({
        id: "todo-new",
        title: "新しいTODO",
        completed: false,
        createdAt: "2026-06-05T02:00:00.000Z",
      }),
      new TodoDto({
        id: "todo-old",
        title: "完了済みTODO",
        completed: true,
        createdAt: "2026-06-05T01:00:00.000Z",
      }),
    ];
  }

  @Post()
  @CreateTodoDocs()
  createTodo(@Body() request: CreateTodoRequestDto): TodoDto {
    return new TodoDto({
      id: "todo-3",
      title: request.title,
      completed: false,
      createdAt: "2026-06-05T02:00:00.000Z",
    });
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @DeleteTodoDocs()
  deleteTodo(@Param("id") id: string): void {
    void id;
  }

  @Patch(":id")
  @UpdateTodoDocs()
  updateTodo(
    @Param("id") id: string,
    @Body() request: UpdateTodoRequestDto,
  ): TodoDto {
    void id;
    void request;

    return new TodoDto({
      id: "todo-new",
      title: "新しいTODO",
      completed: true,
      createdAt: "2026-06-05T02:00:00.000Z",
    });
  }
}
