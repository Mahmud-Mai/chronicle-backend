import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface TimerState {
  id: string;
  userId: string;
  activityId: string;
  duration: number;
  remaining: number;
  status: 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  soundType: 'CHIME' | 'GONG' | 'DIGITAL';
  startedAt: number;
  pausedAt?: number;
}

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly redis: Redis;
  private readonly TIMER_KEY_PREFIX = 'timer:';
  private readonly TIMER_USER_PREFIX = 'timer:user:';

  constructor(private configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get('REDIS_PORT', 6381),
    });
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  async setTimer(timer: TimerState): Promise<void> {
    const key = `${this.TIMER_KEY_PREFIX}${timer.id}`;
    await this.redis.setex(key, 86400, JSON.stringify(timer));
    await this.redis.sadd(`${this.TIMER_USER_PREFIX}${timer.userId}`, timer.id);
  }

  async getTimer(id: string): Promise<TimerState | null> {
    const key = `${this.TIMER_KEY_PREFIX}${id}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async getUserTimers(userId: string): Promise<TimerState[]> {
    const ids = await this.redis.smembers(`${this.TIMER_USER_PREFIX}${userId}`);
    const timers: TimerState[] = [];
    for (const id of ids) {
      const timer = await this.getTimer(id);
      if (timer && timer.status !== 'COMPLETED' && timer.status !== 'CANCELLED') {
        timers.push(timer);
      }
    }
    return timers;
  }

  async deleteTimer(id: string, userId: string): Promise<void> {
    const key = `${this.TIMER_KEY_PREFIX}${id}`;
    await this.redis.del(key);
    await this.redis.srem(`${this.TIMER_USER_PREFIX}${userId}`, id);
  }

  async updateTimerRemaining(id: string, remaining: number): Promise<void> {
    const timer = await this.getTimer(id);
    if (timer) {
      timer.remaining = remaining;
      await this.setTimer(timer);
    }
  }
}
