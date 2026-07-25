import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin' })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message: 'username may only contain letters, numbers, dots, underscores, and hyphens',
  })
  username: string;

  @ApiProperty({ example: '••••••••' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password: string;
}

export class LoginResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty({ enum: ['admin', 'operator', 'viewer'] })
  role: string;

  @ApiProperty()
  username: string;

  @ApiProperty({ description: 'Token lifetime in seconds' })
  expiresIn: number;
}
