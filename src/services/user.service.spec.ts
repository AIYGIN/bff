import { GetUserEntityResponse } from "../interface/entity/get-user.entity";
import type { UserResource } from "../resources/user.resource";
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
    const service = new UserService(userResource);

    await expect(service.getUser({ userId: "user_123" })).resolves.toEqual({
      id: "user_123",
      name: "Sample User",
    });
    expect(getUser).toHaveBeenCalledWith({
      userId: "user_123",
    });
  });
});
