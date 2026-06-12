import { GetUserEntityResponse } from "../../interface/entity/user/get-user.entity";
import {
  AppLogger,
  type ContextLogger,
} from "../../common/logging/app-logger.service";
import { UserResource } from "../../resources/user/user.resource";
import { UserService } from "./user.service";

describe("UserService", () => {
  it("converts the resource entity to a response DTO", async () => {
    const getUser = jest.fn().mockResolvedValue(
      new GetUserEntityResponse({
        id: "user_123",
        name: "Sample User",
      }),
    );
    const userResource = {
      getUser,
    } as unknown as UserResource;
    const contextLogger: ContextLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    const appLogger = {
      withContext: jest.fn().mockReturnValue(contextLogger),
    } as unknown as AppLogger;
    const service = new UserService(userResource, appLogger);

    await expect(service.getUser({ userId: "user_123" })).resolves.toEqual({
      id: "user_123",
      name: "Sample User",
    });
    expect(getUser).toHaveBeenCalledWith({
      userId: "user_123",
    });
    expect(contextLogger.debug).toHaveBeenCalledWith("loading user", {
      userId: "user_123",
    });
  });
});
