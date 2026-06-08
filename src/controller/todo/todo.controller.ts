import { Body, Controller, Post } from "@nestjs/common";
import { CreateTodoDocs } from "../../docs/todos.docs";
import { CreateTodoRequestDto } from "../../interface/dto/todo/create-todo-request.dto";
import { TodoDto } from "../../interface/dto/todo/todo.dto";

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
}
