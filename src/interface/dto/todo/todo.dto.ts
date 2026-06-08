import { ApiProperty } from "@nestjs/swagger";

export class TodoDto {
  @ApiProperty({
    description: "TODO ID",
    example: "todo-3",
  })
  id: string;

  @ApiProperty({
    description: "TODOタイトル",
    example: "請求書を確認する",
  })
  title: string;

  @ApiProperty({
    description: "完了状態。作成直後は false",
    example: false,
  })
  completed: boolean;

  @ApiProperty({
    description: "作成日時。ISO 8601 date-time 文字列",
    example: "2026-06-05T02:00:00.000Z",
    format: "date-time",
  })
  createdAt: string;

  constructor(args: TodoDto) {
    Object.assign(this, args);
  }
}
