import { IsString, IsEnum, IsOptional, IsObject, IsDateString, IsUUID, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ActivityType, EntryStatus } from '@prisma/client';

export class CreateEntryDto {
  @ApiProperty()
  @IsUUID()
  activityId: string;

  @ApiProperty({ enum: ActivityType })
  @IsEnum(ActivityType)
  activityType: ActivityType;

  @ApiProperty({ example: {} })
  @IsObject()
  data: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  loggedAt?: string;
}

export class UpdateEntryDto {
  @ApiPropertyOptional({ example: {} })
  @IsObject()
  @IsOptional()
  data?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ enum: EntryStatus })
  @IsEnum(EntryStatus)
  @IsOptional()
  status?: EntryStatus;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  duration?: number;
}

export class EntryQueryDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  activityId?: string;

  @ApiPropertyOptional({ enum: EntryStatus })
  @IsEnum(EntryStatus)
  @IsOptional()
  status?: EntryStatus;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  from?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  to?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsNumber()
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsNumber()
  @IsOptional()
  limit?: number = 20;
}
