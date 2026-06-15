import { UserDto } from "../../dto/user/user.dto";
import { UserService } from "../../service/user/user.service";
import { UserController } from "./user.controller";

describe("UserController", () => {
  it("passes the request to UserService and returns its response", async () => {
    const response = new UserDto({
      id: "user_123",
      name: "Sample User",
    });
    const getUser = jest.fn().mockResolvedValue(response);
    const userService = {
      getUser,
    } as unknown as UserService;
    const controller = new UserController(userService);
    const request = { userId: "user_123" };

    await expect(controller.getUser(request)).resolves.toBe(response);
    expect(getUser).toHaveBeenCalledWith(request);
  });
});
