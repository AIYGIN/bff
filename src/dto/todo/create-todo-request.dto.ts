import { Transform } from "class-transformer";
import { IsString, MaxLength, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateTodoRequestDto {
  @ApiProperty({
    description: "TODOタイトル",
    example: "請求書を確認する",
    minLength: 1,
    maxLength: 80,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  @IsString({ message: "TODOを入力してください" })
  @MinLength(1, { message: "TODOを入力してください" })
  @MaxLength(80, { message: "TODOは80文字以内で入力してください" })
  title: string;
}
