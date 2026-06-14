import { HttpService } from "@nestjs/axios";
import { AxiosError } from "axios";
import { of, throwError } from "rxjs";
import {
  AppLogger,
  type ContextLogger,
} from "../../common/logging/app-logger.service";
import { ResourceAccessException } from "../../lib/errors/resource-access.exception";
import { GetUserEntityRequest } from "../../interface/entity/user/get-user.entity";
import { UserResource } from "./user.resource";

describe("UserResource", () => {
  const contextLogger: ContextLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  const appLogger = {
    withContext: jest.fn().mockReturnValue(contextLogger),
  } as unknown as AppLogger;

  it("returns a dummy user entity before external API integration", async () => {
    const httpService = {
      get: jest.fn(),
    } as unknown as HttpService;
    const resource = new UserResource(httpService, appLogger, null);

    await expect(
      resource.getUser(new GetUserEntityRequest({ userId: "user_123" })),
    ).resolves.toEqual({
      id: "user_123",
      name: "Sample User",
    });
  });

  it("calls the external API and converts its response to an entity", async () => {
    const get = jest.fn().mockReturnValue(
      of({
        data: {
          id: "external_user_123",
          display_name: "External User",
        },
        status: 200,
      }),
    );
    const httpService = {
      get,
    } as unknown as HttpService;
    const resource = new UserResource(
      httpService,
      appLogger,
      "https://users.example.com",
    );

    await expect(
      resource.getUser(new GetUserEntityRequest({ userId: "user/123" })),
    ).resolves.toEqual({
      id: "external_user_123",
      name: "External User",
    });
    expect(get).toHaveBeenCalledWith(
      "https://users.example.com/users/user%2F123",
    );
  });

  it("converts an HTTP client error to a BFF resource exception", async () => {
    const get = jest
      .fn()
      .mockReturnValue(
        throwError(
          () => new AxiosError("External API request failed", "ERR_NETWORK"),
        ),
      );
    const httpService = {
      get,
    } as unknown as HttpService;
    const resource = new UserResource(
      httpService,
      appLogger,
      "https://users.example.com",
    );

    await expect(
      resource.getUser(new GetUserEntityRequest({ userId: "user_123" })),
    ).rejects.toBeInstanceOf(ResourceAccessException);
  });
});
