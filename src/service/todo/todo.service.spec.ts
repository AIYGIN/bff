import { NotFoundException } from "@nestjs/common";
import type { TodoEntity } from "../../entity/todo.entity";
import { TodoResource } from "../../resource/todo/todo.resource";
import { TodoService } from "./todo.service";

describe("TodoService", () => {
  const ownerUserId = "usr_v1_1234567890123456789012345678901234567890123";
  const todoEntity: TodoEntity = {
    id: "9d1e7289-8f11-4e3e-9cf9-f735e7ee54c0",
    owner_user_id: ownerUserId,
    title: "請求書を確認する",
    completed: false,
    created_at: "2026-06-05T02:00:00+00:00",
    updated_at: "2026-06-05T02:00:00+00:00",
  };
  let todoResource: jest.Mocked<
    Pick<
      TodoResource,
      | "create"
      | "deleteByIdForOwner"
      | "findByIdForOwner"
      | "findManyByOwner"
      | "updateCompletedByIdForOwner"
    >
  >;
  let service: TodoService;

  beforeEach(() => {
    todoResource = {
      create: jest.fn(),
      deleteByIdForOwner: jest.fn(),
      findByIdForOwner: jest.fn(),
      findManyByOwner: jest.fn(),
      updateCompletedByIdForOwner: jest.fn(),
    };
    service = new TodoService(todoResource as unknown as TodoResource);
  });

  it("returns TODOs from Resource as DTOs ordered by Resource result", async () => {
    todoResource.findManyByOwner.mockResolvedValue([todoEntity]);

    await expect(service.getTodos(ownerUserId)).resolves.toEqual([
      {
        id: todoEntity.id,
        title: todoEntity.title,
        completed: todoEntity.completed,
        createdAt: "2026-06-05T02:00:00.000Z",
      },
    ]);
    expect(todoResource.findManyByOwner).toHaveBeenCalledWith(ownerUserId);
  });

  it("returns one TODO owned by the authenticated user", async () => {
    todoResource.findByIdForOwner.mockResolvedValue(todoEntity);

    await expect(service.getTodo(todoEntity.id, ownerUserId)).resolves.toEqual({
      id: todoEntity.id,
      title: todoEntity.title,
      completed: todoEntity.completed,
      createdAt: "2026-06-05T02:00:00.000Z",
    });
    expect(todoResource.findByIdForOwner).toHaveBeenCalledWith(
      todoEntity.id,
      ownerUserId,
    );
  });

  it("throws NotFound when the TODO does not exist for the owner", async () => {
    todoResource.findByIdForOwner.mockResolvedValue(null);

    await expect(service.getTodo(todoEntity.id, ownerUserId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it("creates a TODO for the authenticated user", async () => {
    todoResource.create.mockResolvedValue(todoEntity);

    await expect(
      service.createTodo({ title: todoEntity.title }, ownerUserId),
    ).resolves.toEqual({
      id: todoEntity.id,
      title: todoEntity.title,
      completed: false,
      createdAt: "2026-06-05T02:00:00.000Z",
    });
    expect(todoResource.create).toHaveBeenCalledWith({
      ownerUserId,
      title: todoEntity.title,
    });
  });

  it("deletes a TODO for the authenticated user", async () => {
    todoResource.deleteByIdForOwner.mockResolvedValue(true);

    await expect(
      service.deleteTodo(todoEntity.id, ownerUserId),
    ).resolves.toBeUndefined();
    expect(todoResource.deleteByIdForOwner).toHaveBeenCalledWith(
      todoEntity.id,
      ownerUserId,
    );
  });

  it("throws NotFound when deleting another user's TODO", async () => {
    todoResource.deleteByIdForOwner.mockResolvedValue(false);

    await expect(
      service.deleteTodo(todoEntity.id, ownerUserId),
    ).rejects.toThrow(NotFoundException);
  });

  it("updates completed for a TODO owned by the authenticated user", async () => {
    todoResource.updateCompletedByIdForOwner.mockResolvedValue({
      ...todoEntity,
      completed: true,
    });

    await expect(
      service.updateTodo(todoEntity.id, { completed: true }, ownerUserId),
    ).resolves.toEqual({
      id: todoEntity.id,
      title: todoEntity.title,
      completed: true,
      createdAt: "2026-06-05T02:00:00.000Z",
    });
    expect(todoResource.updateCompletedByIdForOwner).toHaveBeenCalledWith({
      id: todoEntity.id,
      ownerUserId,
      completed: true,
    });
  });

  it("throws NotFound when updating another user's TODO", async () => {
    todoResource.updateCompletedByIdForOwner.mockResolvedValue(null);

    await expect(
      service.updateTodo(todoEntity.id, { completed: true }, ownerUserId),
    ).rejects.toThrow(NotFoundException);
  });
});
