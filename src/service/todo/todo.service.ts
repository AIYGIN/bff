import { Injectable } from "@nestjs/common";
import type { CreateTodoRequestDto } from "../../dto/todo/create-todo-request.dto";
import { TodoDto } from "../../dto/todo/todo.dto";
import type { UpdateTodoRequestDto } from "../../dto/todo/update-todo-request.dto";

@Injectable()
export class TodoService {
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

  createTodo(request: CreateTodoRequestDto): TodoDto {
    return new TodoDto({
      id: "todo-3",
      title: request.title,
      completed: false,
      createdAt: "2026-06-05T02:00:00.000Z",
    });
  }

  deleteTodo(id: string): void {
    void id;
  }

  updateTodo(id: string, request: UpdateTodoRequestDto): TodoDto {
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
