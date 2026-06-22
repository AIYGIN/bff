import { TodoService } from "./todo.service";

describe("TodoService", () => {
  const service = new TodoService();

  it("returns TODO mocks ordered by newest createdAt first", () => {
    expect(service.getTodos()).toEqual([
      {
        id: "todo-new",
        title: "新しいTODO",
        completed: false,
        createdAt: "2026-06-05T02:00:00.000Z",
      },
      {
        id: "todo-old",
        title: "完了済みTODO",
        completed: true,
        createdAt: "2026-06-05T01:00:00.000Z",
      },
    ]);
  });

  it("returns the existing create mock response", () => {
    expect(service.createTodo({ title: "請求書を確認する" })).toEqual({
      id: "todo-3",
      title: "請求書を確認する",
      completed: false,
      createdAt: "2026-06-05T02:00:00.000Z",
    });
  });

  it("keeps delete idempotent with no response body", () => {
    expect(service.deleteTodo("todo-new")).toBeUndefined();
  });

  it("returns the existing update mock response", () => {
    expect(
      service.updateTodo("todo-123", { completed: true }),
    ).toEqual({
      id: "todo-new",
      title: "新しいTODO",
      completed: true,
      createdAt: "2026-06-05T02:00:00.000Z",
    });
  });
});
