import { HttpService } from "@nestjs/axios";
import { Inject, Injectable } from "@nestjs/common";
import { isAxiosError } from "axios";
import { firstValueFrom } from "rxjs";
import {
  AppLogger,
  type ContextLogger,
} from "../../common/logging/app-logger.service";
import { ResourceAccessException } from "../../lib/errors/resource-access.exception";
import {
  type GetUserEntityRequest,
  GetUserEntityResponse,
} from "../../interface/entity/user/get-user.entity";
import { USER_API_BASE_URL } from "./user-resource.constants";

interface ExternalUserResponse {
  id: string;
  display_name: string;
}

@Injectable()
export class UserResource {
  private readonly logger: ContextLogger;

  constructor(
    private readonly httpService: HttpService,
    appLogger: AppLogger,
    @Inject(USER_API_BASE_URL)
    private readonly userApiBaseUrl: string | null,
  ) {
    this.logger = appLogger.withContext(UserResource.name);
  }

  async getUser(request: GetUserEntityRequest): Promise<GetUserEntityResponse> {
    if (!this.userApiBaseUrl) {
      this.logger.debug("using dummy user response", {
        userId: request.userId,
      });
      return new GetUserEntityResponse({
        id: request.userId,
        name: "Sample User",
      });
    }

    try {
      this.logger.debug("requesting user resource", {
        resource: "User API",
        userId: request.userId,
      });
      const url = new URL(
        `users/${encodeURIComponent(request.userId)}`,
        `${this.userApiBaseUrl.replace(/\/+$/, "")}/`,
      );
      const response = await firstValueFrom(
        this.httpService.get<ExternalUserResponse>(url.toString()),
      );

      return new GetUserEntityResponse({
        id: response.data.id,
        name: response.data.display_name,
      });
    } catch (error) {
      if (isAxiosError(error)) {
        this.logger.error(error, { resource: "User API" });
        throw new ResourceAccessException("User API", { cause: error });
      }

      throw error;
    }
  }
}
