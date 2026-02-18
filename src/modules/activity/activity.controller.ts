import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { ActivityService } from './activity.service';
import { CreateActivityDto, UpdateActivityDto } from './dto/activity.dto';
import { SessionGuard } from '../auth/guards/session.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('Activities')
@Controller('activities')
@UseGuards(SessionGuard)
@ApiBearerAuth()
export class ActivityController {
  constructor(private activityService: ActivityService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new activity' })
  async create(@Req() req: Request & { session: { getUserId: () => string } }, @Body() dto: CreateActivityDto) {
    const userId = req.session.getUserId();
    const activity = await this.activityService.create(userId, dto);
    return { data: activity };
  }

  @Get()
  @ApiOperation({ summary: 'List all activities' })
  @ApiQuery({ name: 'includeArchived', required: false, type: Boolean })
  async findAll(@Req() req: Request & { session: { getUserId: () => string } }, @Query('includeArchived') includeArchived?: string) {
    const userId = req.session.getUserId();
    const activities = await this.activityService.findAll(userId, includeArchived === 'true');
    return { data: activities };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get activity by ID' })
  async findOne(@Req() req: Request & { session: { getUserId: () => string } }, @Param('id') id: string) {
    const userId = req.session.getUserId();
    const activity = await this.activityService.findOne(userId, id);
    return { data: activity };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update activity' })
  async update(
    @Req() req: Request & { session: { getUserId: () => string } },
    @Param('id') id: string,
    @Body() dto: UpdateActivityDto,
  ) {
    const userId = req.session.getUserId();
    const activity = await this.activityService.update(userId, id, dto);
    return { data: activity };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete activity' })
  async remove(@Req() req: Request & { session: { getUserId: () => string } }, @Param('id') id: string) {
    const userId = req.session.getUserId();
    await this.activityService.remove(userId, id);
    return { success: true };
  }
}
