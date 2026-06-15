import { Controller, Get, Param } from "@nestjs/common";
import { GetUserDocs } from "../../docs/users.docs";
import type { GetUserRequestDto } from "../../dto/user/get-user-request.dto";
import type { UserDto } from "../../dto/user/user.dto";
import { UserService } from "../../service/user/user.service";

@Controller("users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(":userId")
  @GetUserDocs()
  async getUser(@Param() request: GetUserRequestDto): Promise<UserDto> {
    return this.userService.getUser(request);
  }
}
