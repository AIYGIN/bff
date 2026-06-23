import {
  type ArgumentMetadata,
  HttpException,
  ValidationPipe,
} from "@nestjs/common";
import { CreateTodoRequestDto } from "../../dto/todo/create-todo-request.dto";
import { UpdateTodoRequestDto } from "../../dto/todo/update-todo-request.dto";
import type { CurrentUser } from "../../guard/current-user";
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
  const currentUser: CurrentUser = {
    subject: "usr_v1_1234567890123456789012345678901234567890123",
    displayName: "TODO User",
  };
  let todoService: jest.Mocked<
    Pick<
      TodoService,
      "createTodo" | "deleteTodo" | "getTodo" | "getTodos" | "updateTodo"
    >
  >;
  let controller: TodoController;

  beforeEach(() => {
    todoService = {
      createTodo: jest.fn(),
      deleteTodo: jest.fn(),
      getTodo: jest.fn(),
      getTodos: jest.fn(),
      updateTodo: jest.fn(),
    };
    controller = new TodoController(todoService as unknown as TodoService);
  });

  it("delegates authenticated TODO listing to TodoService", async () => {
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
    todoService.getTodos.mockResolvedValue(response);

    await expect(controller.getTodos(currentUser)).resolves.toBe(response);
    expect(todoService.getTodos).toHaveBeenCalledWith(currentUser.subject);
  });

  it("passes a validated create request and owner user id to TodoService", async () => {
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
    todoService.createTodo.mockResolvedValue(response);

    await expect(controller.createTodo(request, currentUser)).resolves.toBe(
      response,
    );
    expect(todoService.createTodo).toHaveBeenCalledWith(
      request,
      currentUser.subject,
    );
  });

  it("passes the TODO id and owner user id to TodoService when reading one TODO", async () => {
    const response = {
      id: "todo-new",
      title: "新しいTODO",
      completed: false,
      createdAt: "2026-06-05T02:00:00.000Z",
    };
    todoService.getTodo.mockResolvedValue(response);

    await expect(controller.getTodo("todo-new", currentUser)).resolves.toBe(
      response,
    );
    expect(todoService.getTodo).toHaveBeenCalledWith(
      "todo-new",
      currentUser.subject,
    );
  });

  it("passes the TODO id and owner user id to TodoService when deleting", async () => {
    todoService.deleteTodo.mockResolvedValue(undefined);

    await expect(
      controller.deleteTodo("todo-new", currentUser),
    ).resolves.toBeUndefined();
    expect(todoService.deleteTodo).toHaveBeenCalledWith(
      "todo-new",
      currentUser.subject,
    );
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

    it("accepts the path id and body and passes owner user id to TodoService", async () => {
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
      todoService.updateTodo.mockResolvedValue(response);

      await expect(
        controller.updateTodo("todo-123", request, currentUser),
      ).resolves.toBe(response);
      expect(todoService.updateTodo).toHaveBeenCalledWith(
        "todo-123",
        request,
        currentUser.subject,
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
