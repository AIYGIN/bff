import { Body, Controller, Param, Patch, Post } from "@nestjs/common";
import { CreateTodoDocs, UpdateTodoDocs } from "../../docs/todos.docs";
import { CreateTodoRequestDto } from "../../interface/dto/todo/create-todo-request.dto";
import { TodoDto } from "../../interface/dto/todo/todo.dto";
import { UpdateTodoRequestDto } from "../../interface/dto/todo/update-todo-request.dto";

@Controller("todos")
export class TodoController {
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
