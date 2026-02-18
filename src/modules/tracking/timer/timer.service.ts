import { Injectable, NotFoundException } from '@nestjs/common';
import { RedisService, TimerState } from '../../../prisma/redis.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { TimerGateway } from './timer.gateway';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TimerService {
  constructor(
    private redisService: RedisService,
    private prisma: PrismaService,
    private timerGateway: TimerGateway,
  ) {}

  async startTimer(
    userId: string,
    activityId: string,
    duration: number,
    soundType: 'CHIME' | 'GONG' | 'DIGITAL' = 'CHIME',
  ) {
    const activity = await this.prisma.activity.findFirst({
      where: { id: activityId, userId },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    const timer: TimerState = {
      id: uuidv4(),
      userId,
      activityId,
      duration,
      remaining: duration,
      status: 'RUNNING',
      soundType,
      startedAt: Date.now(),
    };

    await this.redisService.setTimer(timer);
    await this.timerGateway.broadcastTimerUpdate(timer);

    return timer;
  }

  async pauseTimer(userId: string, timerId: string) {
    const timer = await this.redisService.getTimer(timerId);

    if (!timer || timer.userId !== userId) {
      throw new NotFoundException('Timer not found');
    }

    if (timer.status !== 'RUNNING') {
      throw new Error('Timer is not running');
    }

    const elapsed = Math.floor((Date.now() - timer.startedAt) / 1000);
    timer.remaining = Math.max(0, timer.duration - elapsed);
    timer.status = 'PAUSED';
    timer.pausedAt = Date.now();

    await this.redisService.setTimer(timer);
    await this.timerGateway.broadcastTimerUpdate(timer);

    return timer;
  }

  async resumeTimer(userId: string, timerId: string) {
    const timer = await this.redisService.getTimer(timerId);

    if (!timer || timer.userId !== userId) {
      throw new NotFoundException('Timer not found');
    }

    if (timer.status !== 'PAUSED') {
      throw new Error('Timer is not paused');
    }

    const pausedDuration = timer.pausedAt ? Date.now() - timer.pausedAt : 0;
    timer.startedAt = Date.now() - ((timer.duration - timer.remaining) * 1000) - pausedDuration;
    timer.status = 'RUNNING';
    timer.pausedAt = undefined;

    await this.redisService.setTimer(timer);
    await this.timerGateway.broadcastTimerUpdate(timer);

    return timer;
  }

  async completeTimer(userId: string, timerId: string) {
    const timer = await this.redisService.getTimer(timerId);

    if (!timer || timer.userId !== userId) {
      throw new NotFoundException('Timer not found');
    }

    let totalDuration: number;
    if (timer.status === 'RUNNING') {
      const elapsed = Math.floor((Date.now() - timer.startedAt) / 1000);
      totalDuration = Math.min(elapsed, timer.duration);
    } else {
      totalDuration = timer.duration - timer.remaining;
    }

    timer.status = 'COMPLETED';
    timer.remaining = 0;

    const entry = await this.prisma.activityEntry.create({
      data: {
        userId,
        activityId: timer.activityId,
        activityType: 'TIME',
        data: {
          duration: totalDuration,
          soundType: timer.soundType,
        },
        loggedAt: new Date(),
      },
    });

    await this.redisService.deleteTimer(timerId, userId);
    await this.timerGateway.broadcastTimerComplete(timer);

    return { timer, entry };
  }

  async cancelTimer(userId: string, timerId: string) {
    const timer = await this.redisService.getTimer(timerId);

    if (!timer || timer.userId !== userId) {
      throw new NotFoundException('Timer not found');
    }

    timer.status = 'CANCELLED';
    await this.redisService.deleteTimer(timerId, userId);
    await this.timerGateway.broadcastTimerUpdate(timer);

    return { success: true };
  }

  async getTimer(userId: string, timerId: string) {
    const timer = await this.redisService.getTimer(timerId);

    if (!timer || timer.userId !== userId) {
      throw new NotFoundException('Timer not found');
    }

    return timer;
  }

  async getUserActiveTimers(userId: string) {
    return this.redisService.getUserTimers(userId);
  }

  async updateRemainingTime(timerId: string, remaining: number) {
    await this.redisService.updateTimerRemaining(timerId, remaining);
  }
}
