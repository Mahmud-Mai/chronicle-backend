import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsQueryDto, HeatmapQueryDto, StreakQueryDto } from './dto/analytics.dto';
import { EntryStatus, ActivityType, TimerStatus } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getOverview(userId: string, query: AnalyticsQueryDto) {
    const where = this.buildDateFilter(userId, query);

    const [totalEntries, totalTime, streak, activitiesCount] = await Promise.all([
      this.prisma.activityEntry.count({
        where: { ...where, status: EntryStatus.ACTIVE },
      }),
      this.getTotalTime(userId, query),
      this.getCurrentStreak(userId, query.activityId),
      this.prisma.activity.count({
        where: { userId, isArchived: false },
      }),
    ]);

    return {
      totalEntries,
      totalTime,
      currentStreak: streak,
      activitiesCount,
    };
  }

  async getActivityStats(userId: string, activityId: string, query: AnalyticsQueryDto) {
    const where = {
      ...this.buildDateFilter(userId, query),
      activityId,
      status: EntryStatus.ACTIVE,
    };

    const entries = await this.prisma.activityEntry.findMany({
      where,
      select: { data: true, activityType: true, loggedAt: true },
      orderBy: { loggedAt: 'desc' },
    });

    const activityType = entries[0]?.activityType;
    
    let totalValue = 0;
    let totalTimeSeconds = 0;

    if (activityType === ActivityType.TIME) {
      totalTimeSeconds = entries.reduce((sum: number, e) => {
        const duration = (e.data as Record<string, unknown>)?.duration as number;
        return sum + (duration ?? 0);
      }, 0);
    } else {
      totalValue = entries.reduce((sum: number, e) => {
        const value = (e.data as Record<string, unknown>)?.value as number;
        return sum + (value ?? 0);
      }, 0);
    }

    return {
      totalEntries: entries.length,
      totalValue,
      totalTimeSeconds,
      totalTimeFormatted: this.formatDuration(totalTimeSeconds),
      averagePerDay: entries.length > 0 ? entries.length / 7 : 0,
    };
  }

  async getHeatmap(userId: string, query: HeatmapQueryDto) {
    const where = {
      ...this.buildDateFilter(userId, query),
      status: EntryStatus.ACTIVE,
    };

    const entries = await this.prisma.activityEntry.findMany({
      where,
      select: { loggedAt: true, activityType: true, data: true },
      orderBy: { loggedAt: 'asc' },
    });

    const heatmap: Record<string, number> = {};
    
    for (const entry of entries) {
      const dateKey = entry.loggedAt.toISOString().split('T')[0];
      
      if (entry.activityType === ActivityType.TIME) {
        const duration = (entry.data as Record<string, unknown>)?.duration as number;
        heatmap[dateKey] = (heatmap[dateKey] ?? 0) + (duration ?? 0);
      } else {
        const value = (entry.data as Record<string, unknown>)?.value as number;
        heatmap[dateKey] = (heatmap[dateKey] ?? 0) + (value ?? 0);
      }
    }

    return Object.entries(heatmap).map(([date, value]) => ({
      date,
      value: Math.round(value),
    }));
  }

  async getStreak(userId: string, query: StreakQueryDto) {
    return this.getCurrentStreak(userId, query.activityId);
  }

  async getDistribution(userId: string, query: AnalyticsQueryDto) {
    const where = this.buildDateFilter(userId, query);

    const entries = await this.prisma.activityEntry.findMany({
      where: { ...where, status: EntryStatus.ACTIVE },
      include: { activity: { select: { name: true, color: true } } },
    });

    const distribution: Record<string, { name: string; color: string; count: number; percentage: number }> = {};

    for (const entry of entries) {
      const activityName = entry.activity.name;
      if (!distribution[activityName]) {
        distribution[activityName] = {
          name: activityName,
          color: entry.activity.color,
          count: 0,
          percentage: 0,
        };
      }
      distribution[activityName].count++;
    }

    const total = entries.length;
    const result = Object.values(distribution).map((item) => ({
      ...item,
      percentage: total > 0 ? Math.round((item.count / total) * 100) : 0,
    }));

    return result.sort((a, b) => b.count - a.count);
  }

  async getActivityBreakdown(userId: string, query: AnalyticsQueryDto) {
    const where = this.buildDateFilter(userId, query);

    const entries = await this.prisma.activityEntry.findMany({
      where: { ...where, status: EntryStatus.ACTIVE },
      include: { activity: { select: { id: true, name: true, color: true, icon: true } } },
      orderBy: { loggedAt: 'desc' },
    });

    const breakdown: Record<string, { activity: { id: string; name: string; color: string; icon: string }; entries: number; timeSeconds: number }> = {};

    for (const entry of entries) {
      const activityId = entry.activity.id;
      if (!breakdown[activityId]) {
        breakdown[activityId] = {
          activity: entry.activity,
          entries: 0,
          timeSeconds: 0,
        };
      }
      breakdown[activityId].entries++;
      if (entry.activityType === ActivityType.TIME) {
        const duration = (entry.data as Record<string, unknown>)?.duration as number;
        breakdown[activityId].timeSeconds += duration ?? 0;
      }
    }

    return Object.values(breakdown).map((item) => ({
      ...item,
      timeFormatted: this.formatDuration(item.timeSeconds),
    }));
  }

  private async getTotalTime(userId: string, query: AnalyticsQueryDto): Promise<string> {
    const where = this.buildDateFilter(userId, query);

    const entries = await this.prisma.activityEntry.findMany({
      where: { ...where, status: EntryStatus.ACTIVE, activityType: ActivityType.TIME },
      select: { data: true },
    });

    const totalSeconds = entries.reduce((sum: number, e) => {
      const duration = (e.data as Record<string, unknown>)?.duration as number;
      return sum + (duration ?? 0);
    }, 0);

    return this.formatDuration(totalSeconds);
  }

  private async getCurrentStreak(userId: string, activityId?: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where: Record<string, unknown> = {
      userId,
      status: EntryStatus.ACTIVE,
      loggedAt: { gte: today },
    };

    if (activityId) {
      where.activityId = activityId;
    }

    const hasEntryToday = await this.prisma.activityEntry.findFirst({ where });

    if (!hasEntryToday) {
      return 0;
    }

    let streak = 1;
    let currentDate = new Date(today);
    currentDate.setDate(currentDate.getDate() - 1);

    while (true) {
      const dayStart = new Date(currentDate);
      const dayEnd = new Date(currentDate);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayWhere = {
        ...where,
        loggedAt: { gte: dayStart, lt: dayEnd },
      };

      const hasEntry = await this.prisma.activityEntry.findFirst({ where: dayWhere });
      
      if (!hasEntry) break;
      
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }

    return streak;
  }

  private buildDateFilter(userId: string, query: AnalyticsQueryDto) {
    const where: Record<string, unknown> = { userId };

    if (query.activityId) {
      where.activityId = query.activityId;
    }

    if (query.from || query.to) {
      where.loggedAt = {};
      if (query.from) {
        (where.loggedAt as Record<string, Date>).gte = new Date(query.from);
      }
      if (query.to) {
        (where.loggedAt as Record<string, Date>).lte = new Date(query.to);
      }
    }

    return where;
  }

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}
