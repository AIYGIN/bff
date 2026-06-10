import { Injectable } from "@nestjs/common";
import type { GetUserRequestDto } from "../interface/dto/get-user-request.dto";
import { UserDto } from "../interface/dto/user.dto";
import { GetUserEntityRequest } from "../interface/entity/get-user.entity";
import { UserResource } from "../resources/user.resource";

@Injectable()
export class UserService {
  constructor(private readonly userResource: UserResource) {}

  async getUser(request: GetUserRequestDto): Promise<UserDto> {
    const user = await this.userResource.getUser(
      new GetUserEntityRequest({
        userId: request.userId,
      }),
    );

    return new UserDto({
      id: user.id,
      name: user.name,
    });
  }
}
