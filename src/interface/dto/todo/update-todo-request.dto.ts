import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean } from "class-validator";

export class UpdateTodoRequestDto {
  @ApiProperty({
    description: "TODOの完了状態",
    example: true,
  })
  @IsBoolean({ message: "完了状態を指定してください" })
  completed: boolean;
}
