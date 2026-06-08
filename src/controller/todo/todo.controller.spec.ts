import {
  ArgumentMetadata,
  HttpException,
  ValidationPipe,
} from "@nestjs/common";
import { CreateTodoRequestDto } from "../../interface/dto/todo/create-todo-request.dto";
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
});
