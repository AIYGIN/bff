import {
  ApiProperty,
  ApiPropertyOptional,
} from "@nestjs/swagger";
import {
  IsDefined,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";

export class GoogleCallbackQueryDto {
  @ApiPropertyOptional({
    description: "Google authorization code",
    example: "mock-code",
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  code?: string;

  @ApiProperty({
    description: "OAuth state",
    example: "mock-oauth-state",
  })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  state?: string;

  @ApiPropertyOptional({
    description: "Google OAuth error",
    example: "access_denied",
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  error?: string;
}
