import {
  ApiProperty,
  ApiPropertyOptional,
} from "@nestjs/swagger";

export class AuthMeResponseDto {
  @ApiProperty({
    description: "表示用ユーザー名",
    example: "Sample User",
  })
  displayName: string;

  @ApiPropertyOptional({
    description: "表示用プロフィール画像 URL",
    example: "https://example.com/profile.jpg",
    format: "uri",
    nullable: false,
  })
  profileImageUrl?: string;

  constructor(args: AuthMeResponseDto) {
    Object.assign(this, args);
  }
}
