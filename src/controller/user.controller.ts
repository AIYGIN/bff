import { Controller, Get, Param } from "@nestjs/common";
import { GetUserDocs } from "../docs/users.docs";
import { GetUserRequestDto } from "../interface/dto/get-user-request.dto";
import { UserDto } from "../interface/dto/user.dto";
import { UserService } from "../services/user.service";

@Controller("users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(":userId")
  @GetUserDocs()
  async getUser(@Param() request: GetUserRequestDto): Promise<UserDto> {
    return this.userService.getUser(request);
  }
}
