import { IsString, IsEnum, IsOptional, IsObject, IsHexColor } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ActivityType } from '@prisma/client';

export class CreateActivityDto {
  @ApiProperty({ example: 'Morning Meditation' })
  @IsString()
  name: string;

  @ApiProperty({ enum: ActivityType, example: ActivityType.TIME })
  @IsEnum(ActivityType)
  type: ActivityType;

  @ApiPropertyOptional({ example: {} })
  @IsObject()
  @IsOptional()
  config?: Record<string, unknown>;

  @ApiPropertyOptional({ example: '#6366f1' })
  @IsHexColor()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ example: '🧘' })
  @IsString()
  @IsOptional()
  icon?: string;
}

export class UpdateActivityDto {
  @ApiPropertyOptional({ example: 'Evening Meditation' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: {} })
  @IsObject()
  @IsOptional()
  config?: Record<string, unknown>;

  @ApiPropertyOptional({ example: '#10b981' })
  @IsHexColor()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ example: '🌙' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  isArchived?: boolean;
}
