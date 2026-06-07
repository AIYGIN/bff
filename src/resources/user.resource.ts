import { HttpService } from "@nestjs/axios";
import { Inject, Injectable } from "@nestjs/common";
import { isAxiosError } from "axios";
import { firstValueFrom } from "rxjs";
import { ResourceAccessException } from "../lib/errors/resource-access.exception";
import {
  GetUserEntityRequest,
  GetUserEntityResponse,
} from "../interface/entity/get-user.entity";
import { USER_API_BASE_URL } from "./user-resource.constants";

interface ExternalUserResponse {
  id: string;
  display_name: string;
}

@Injectable()
export class UserResource {
  constructor(
    private readonly httpService: HttpService,
    @Inject(USER_API_BASE_URL)
    private readonly userApiBaseUrl: string | null = null,
  ) {}

  async getUser(request: GetUserEntityRequest): Promise<GetUserEntityResponse> {
    if (!this.userApiBaseUrl) {
      return new GetUserEntityResponse({
        id: request.userId,
        name: "Sample User",
      });
    }

    try {
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
        throw new ResourceAccessException("User API", { cause: error });
      }

      throw error;
    }
  }
}
