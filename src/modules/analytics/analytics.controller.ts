import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SessionGuard } from '../auth/guards/session.guard';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto, HeatmapQueryDto, StreakQueryDto } from './dto/analytics.dto';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(SessionGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get analytics overview' })
  getOverview(@Request() req: { user: { id: string } }, @Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getOverview(req.user.id, query);
  }

  @Get('activity/:id')
  @ApiOperation({ summary: 'Get stats for a specific activity' })
  getActivityStats(
    @Request() req: { user: { id: string } },
    @Query('id') id: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getActivityStats(req.user.id, id, query);
  }

  @Get('heatmap')
  @ApiOperation({ summary: 'Get heatmap data' })
  getHeatmap(@Request() req: { user: { id: string } }, @Query() query: HeatmapQueryDto) {
    return this.analyticsService.getHeatmap(req.user.id, query);
  }

  @Get('streak')
  @ApiOperation({ summary: 'Get current streak' })
  getStreak(@Request() req: { user: { id: string } }, @Query() query: StreakQueryDto) {
    return this.analyticsService.getStreak(req.user.id, query);
  }

  @Get('distribution')
  @ApiOperation({ summary: 'Get entry distribution by activity' })
  getDistribution(@Request() req: { user: { id: string } }, @Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getDistribution(req.user.id, query);
  }

  @Get('breakdown')
  @ApiOperation({ summary: 'Get activity breakdown' })
  getBreakdown(@Request() req: { user: { id: string } }, @Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getActivityBreakdown(req.user.id, query);
  }
}
