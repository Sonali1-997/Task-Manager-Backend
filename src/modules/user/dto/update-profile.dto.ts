import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

/** Self-service profile edit. All fields optional; role/status are not editable here. */
export class UpdateProfileDto {
  @ApiProperty({ example: 'Sonali Sharma', maxLength: 100, required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @ApiProperty({ example: 'sonali@example.com', maxLength: 190, required: false })
  @IsOptional()
  @IsEmail()
  @MaxLength(190)
  email?: string;

  @ApiProperty({
    example: 'newPassword123',
    minLength: 8,
    maxLength: 72,
    required: false,
    description: 'New password (requires currentPassword)',
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  newPassword?: string;

  @ApiProperty({
    example: 'password123',
    required: false,
    description: 'Required when changing password',
  })
  @ValidateIf((o) => o.newPassword !== undefined)
  @IsString()
  @IsNotEmpty()
  currentPassword?: string;
}
