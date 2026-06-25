import { Injectable, NotFoundException } from "@nestjs/common";
import type { CreateTodoRequestDto } from "../../dto/todo/create-todo-request.dto";
import { TodoDto } from "../../dto/todo/todo.dto";
import type { UpdateTodoRequestDto } from "../../dto/todo/update-todo-request.dto";
import type { TodoEntity } from "../../entity/todo.entity";
import { TodoResource } from "../../resource/todo/todo.resource";

@Injectable()
export class TodoService {
  constructor(private readonly todoResource: TodoResource) {}

  async getTodos(ownerUserId: string): Promise<TodoDto[]> {
    const entities = await this.todoResource.findManyByOwner(ownerUserId);
    return entities.map(this.toDto);
  }

  async getTodo(id: string, ownerUserId: string): Promise<TodoDto> {
    const entity = await this.todoResource.findByIdForOwner(id, ownerUserId);
    if (entity === null) {
      throw new NotFoundException("TODOが見つかりません");
    }
    return this.toDto(entity);
  }

  async createTodo(
    request: CreateTodoRequestDto,
    ownerUserId: string,
  ): Promise<TodoDto> {
    const entity = await this.todoResource.create({
      ownerUserId,
      title: request.title,
    });
    return this.toDto(entity);
  }

  async deleteTodo(id: string, ownerUserId: string): Promise<void> {
    const deleted = await this.todoResource.deleteByIdForOwner(id, ownerUserId);
    if (!deleted) {
      throw new NotFoundException("TODOが見つかりません");
    }
  }

  async updateTodo(
    id: string,
    request: UpdateTodoRequestDto,
    ownerUserId: string,
  ): Promise<TodoDto> {
    const entity = await this.todoResource.updateCompletedByIdForOwner({
      id,
      ownerUserId,
      completed: request.completed,
    });
    if (entity === null) {
      throw new NotFoundException("TODOが見つかりません");
    }
    return this.toDto(entity);
  }

  private toDto = (entity: TodoEntity): TodoDto =>
    new TodoDto({
      id: entity.id,
      title: entity.title,
      completed: entity.completed,
      createdAt: new Date(entity.created_at).toISOString(),
    });
}
