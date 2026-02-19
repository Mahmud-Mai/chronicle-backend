import { IsOptional, IsDateString, IsNumber, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AnalyticsQueryDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  activityId?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  from?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  to?: string;
}

export class HeatmapQueryDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  activityId?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  from?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  to?: string;
}

export class StreakQueryDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  activityId?: string;
}
