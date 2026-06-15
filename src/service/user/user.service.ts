import { Injectable } from "@nestjs/common";
import {
  AppLogger,
  type ContextLogger,
} from "../../common/logging/app-logger.service";
import type { GetUserRequestDto } from "../../dto/user/get-user-request.dto";
import { UserDto } from "../../dto/user/user.dto";
import { GetUserEntityRequest } from "../../entity/get-user.entity";
import { UserResource } from "../../resource/user/user.resource";

@Injectable()
export class UserService {
  private readonly logger: ContextLogger;

  constructor(
    private readonly userResource: UserResource,
    appLogger: AppLogger,
  ) {
    this.logger = appLogger.withContext(UserService.name);
  }

  async getUser(request: GetUserRequestDto): Promise<UserDto> {
    this.logger.debug("loading user", { userId: request.userId });
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
