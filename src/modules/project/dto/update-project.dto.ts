import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/** All fields optional — only the provided ones are changed. */
export class UpdateProjectDto {
  @ApiProperty({ example: 'Website Redesign', maxLength: 150, required: false })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @ApiProperty({ example: 'Updated description', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
