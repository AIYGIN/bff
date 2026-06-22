import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class GetUserRequestDto {
  @ApiProperty({
    description: "ユーザーID",
    example: "user_123",
  })
  @IsString()
  @IsNotEmpty()
  userId: string;
}
