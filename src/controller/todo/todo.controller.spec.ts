import {
  type ArgumentMetadata,
  HttpException,
  ValidationPipe,
} from "@nestjs/common";
import { CreateTodoRequestDto } from "../../interface/dto/todo/create-todo-request.dto";
import { UpdateTodoRequestDto } from "../../interface/dto/todo/update-todo-request.dto";
import { TodoController } from "./todo.controller";

describe("TodoController", () => {
  const validationPipe = new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  const bodyMetadata: ArgumentMetadata = {
    type: "body",
    metatype: CreateTodoRequestDto,
  };

  it("returns TODO mocks ordered by newest createdAt first", () => {
    const controller = new TodoController();

    expect(controller.getTodos()).toEqual([
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

  it("returns a created TODO mock with the trimmed request title", async () => {
    const controller = new TodoController();
    const request = (await validationPipe.transform(
      { title: "  請求書を確認する  " },
      bodyMetadata,
    )) as CreateTodoRequestDto;

    expect(controller.createTodo(request)).toEqual({
      id: "todo-3",
      title: "請求書を確認する",
      completed: false,
      createdAt: "2026-06-05T02:00:00.000Z",
    });
  });

  it("accepts the TODO id and returns no response body when deleting", () => {
    const controller = new TodoController();

    expect(controller.deleteTodo("todo-new")).toBeUndefined();
  });

  const expectValidationMessage = async (
    value: object,
    message: string,
  ): Promise<void> => {
    try {
      await validationPipe.transform(value, bodyMetadata);
      fail("ValidationPipe should reject the request body");
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      const response = (error as HttpException).getResponse() as {
        message?: unknown;
      };
      expect(Array.isArray(response.message)).toBe(true);
      expect(response.message).toContain(message);
    }
  };

  it.each([
    ["missing title", {}],
    ["non-string title", { title: 1 }],
    ["empty title", { title: "" }],
    ["blank title", { title: "   " }],
  ])("rejects %s", async (_name, value) => {
    await expectValidationMessage(value, "TODOを入力してください");
  });

  it("rejects titles longer than 80 characters after trim", async () => {
    await expectValidationMessage(
      { title: "あ".repeat(81) },
      "TODOは80文字以内で入力してください",
    );
  });

  describe("updateTodo", () => {
    const controller = new TodoController();
    const updateBodyMetadata: ArgumentMetadata = {
      type: "body",
      metatype: UpdateTodoRequestDto,
    };

    it("accepts the path id and body and returns the updated TODO mock", async () => {
      const request = (await validationPipe.transform(
        { completed: true },
        updateBodyMetadata,
      )) as UpdateTodoRequestDto;

      expect(controller.updateTodo("todo-123", request)).toEqual({
        id: "todo-new",
        title: "新しいTODO",
        completed: true,
        createdAt: "2026-06-05T02:00:00.000Z",
      });
    });

    it.each([
      ["missing completed", {}],
      ["non-boolean completed", { completed: "true" }],
    ])("rejects %s", async (_name, value) => {
      try {
        await validationPipe.transform(value, updateBodyMetadata);
        fail("ValidationPipe should reject the request body");
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        const response = (error as HttpException).getResponse() as {
          message?: unknown;
        };
        expect(Array.isArray(response.message)).toBe(true);
        expect(response.message).toContain("完了状態を指定してください");
      }
    });
  });
});
