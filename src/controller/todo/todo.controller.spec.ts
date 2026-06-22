import {
  type ArgumentMetadata,
  HttpException,
  ValidationPipe,
} from "@nestjs/common";
import { CreateTodoRequestDto } from "../../dto/todo/create-todo-request.dto";
import { UpdateTodoRequestDto } from "../../dto/todo/update-todo-request.dto";
import { TodoService } from "../../service/todo/todo.service";
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
  const todoService = {
    createTodo: jest.fn(),
    deleteTodo: jest.fn(),
    getTodos: jest.fn(),
    updateTodo: jest.fn(),
  } as unknown as jest.Mocked<TodoService>;
  const controller = new TodoController(todoService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("delegates TODO listing to TodoService", () => {
    const response = [
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
    ];
    todoService.getTodos.mockReturnValue(response);

    expect(controller.getTodos()).toBe(response);
    expect(todoService.getTodos).toHaveBeenCalledTimes(1);
  });

  it("passes a validated create request to TodoService", async () => {
    const request = (await validationPipe.transform(
      { title: "  請求書を確認する  " },
      bodyMetadata,
    )) as CreateTodoRequestDto;
    const response = {
      id: "todo-3",
      title: "請求書を確認する",
      completed: false,
      createdAt: "2026-06-05T02:00:00.000Z",
    };
    todoService.createTodo.mockReturnValue(response);

    expect(controller.createTodo(request)).toBe(response);
    expect(todoService.createTodo).toHaveBeenCalledWith(request);
  });

  it("passes the TODO id to TodoService when deleting", () => {
    expect(controller.deleteTodo("todo-new")).toBeUndefined();
    expect(todoService.deleteTodo).toHaveBeenCalledWith("todo-new");
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
    const updateBodyMetadata: ArgumentMetadata = {
      type: "body",
      metatype: UpdateTodoRequestDto,
    };

    it("accepts the path id and body and returns the updated TODO mock", async () => {
      const request = (await validationPipe.transform(
        { completed: true },
        updateBodyMetadata,
      )) as UpdateTodoRequestDto;
      const response = {
        id: "todo-new",
        title: "新しいTODO",
        completed: true,
        createdAt: "2026-06-05T02:00:00.000Z",
      };
      todoService.updateTodo.mockReturnValue(response);

      expect(controller.updateTodo("todo-123", request)).toBe(response);
      expect(todoService.updateTodo).toHaveBeenCalledWith(
        "todo-123",
        request,
      );
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
