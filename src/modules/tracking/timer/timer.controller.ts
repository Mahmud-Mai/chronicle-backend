import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { TimerService } from './timer.service';
import { SessionGuard } from '../../auth/guards/session.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Timer')
@Controller('timer')
@UseGuards(SessionGuard)
@ApiBearerAuth()
export class TimerController {
  constructor(private timerService: TimerService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start a new timer session' })
  async startTimer(
    @Req() req: Request & { session: { getUserId: () => string } },
    @Body() body: { activityId: string; duration: number; soundType?: 'CHIME' | 'GONG' | 'DIGITAL' },
  ) {
    const userId = req.session.getUserId();
    const timer = await this.timerService.startTimer(
      userId,
      body.activityId,
      body.duration,
      body.soundType || 'CHIME',
    );
    return { data: timer };
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pause a running timer' })
  async pauseTimer(
    @Req() req: Request & { session: { getUserId: () => string } },
    @Param('id') id: string,
  ) {
    const userId = req.session.getUserId();
    const timer = await this.timerService.pauseTimer(userId, id);
    return { data: timer };
  }

  @Post(':id/resume')
  @ApiOperation({ summary: 'Resume a paused timer' })
  async resumeTimer(
    @Req() req: Request & { session: { getUserId: () => string } },
    @Param('id') id: string,
  ) {
    const userId = req.session.getUserId();
    const timer = await this.timerService.resumeTimer(userId, id);
    return { data: timer };
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete timer and create entry' })
  async completeTimer(
    @Req() req: Request & { session: { getUserId: () => string } },
    @Param('id') id: string,
  ) {
    const userId = req.session.getUserId();
    const result = await this.timerService.completeTimer(userId, id);
    return { data: result };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a timer' })
  async cancelTimer(
    @Req() req: Request & { session: { getUserId: () => string } },
    @Param('id') id: string,
  ) {
    const userId = req.session.getUserId();
    await this.timerService.cancelTimer(userId, id);
    return { success: true };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get timer by ID' })
  async getTimer(
    @Req() req: Request & { session: { getUserId: () => string } },
    @Param('id') id: string,
  ) {
    const userId = req.session.getUserId();
    const timer = await this.timerService.getTimer(userId, id);
    return { data: timer };
  }

  @Get()
  @ApiOperation({ summary: 'Get all active timers for current user' })
  async getUserTimers(@Req() req: Request & { session: { getUserId: () => string } }) {
    const userId = req.session.getUserId();
    const timers = await this.timerService.getUserActiveTimers(userId);
    return { data: timers };
  }
}
