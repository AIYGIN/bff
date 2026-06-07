import { ApiProperty } from "@nestjs/swagger";

export class UserDto {
  @ApiProperty({
    description: "ユーザーID",
    example: "user_123",
  })
  id: string;

  @ApiProperty({
    description: "ユーザー名",
    example: "Sample User",
  })
  name: string;

  constructor(args: UserDto) {
    Object.assign(this, args);
  }
}
