import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../../common/enums';

/** Payload for an admin creating a user (role is selectable). */
export class CreateUserDto {
  @ApiProperty({ example: 'Sonali Sharma', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'sonali@example.com', maxLength: 190 })
  @IsEmail()
  @MaxLength(190)
  email: string;

  @ApiProperty({ example: 'password123', minLength: 8, maxLength: 72 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.USER,
    required: false,
    description: "Defaults to 'user' when omitted",
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
