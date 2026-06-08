import { ApiProperty } from "@nestjs/swagger";

export class ErrorResponseSchema {
  @ApiProperty({
    description: "エラーメッセージ",
    example: "TODOを入力してください",
  })
  message: string;
}
