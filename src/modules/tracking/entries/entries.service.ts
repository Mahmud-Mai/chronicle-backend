import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateEntryDto, UpdateEntryDto, EntryQueryDto } from './dto/entry.dto';
import { EntryStatus, ActivityType } from '@prisma/client';
import { Prisma } from '@prisma/client';

@Injectable()
export class EntriesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateEntryDto) {
    const activity = await this.prisma.activity.findFirst({
      where: { id: dto.activityId, userId },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    return this.prisma.activityEntry.create({
      data: {
        activityId: dto.activityId,
        userId,
        activityType: dto.activityType,
        data: dto.data as Prisma.InputJsonValue,
        notes: dto.notes,
        loggedAt: dto.loggedAt ? new Date(dto.loggedAt) : new Date(),
      },
      include: { activity: true },
    });
  }

  async findAll(userId: string, query: EntryQueryDto) {
    const where: Record<string, unknown> = { userId };

    if (query.activityId) {
      where.activityId = query.activityId;
    }

    if (query.status) {
      where.status = query.status;
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

    const [entries, total] = await Promise.all([
      this.prisma.activityEntry.findMany({
        where,
        include: { activity: true },
        orderBy: { loggedAt: 'desc' },
        skip: ((query.page ?? 1) - 1) * (query.limit ?? 20),
        take: query.limit ?? 20,
      }),
      this.prisma.activityEntry.count({ where }),
    ]);

    return {
      data: entries,
      meta: {
        total,
        page: query.page ?? 1,
        limit: query.limit ?? 20,
        totalPages: Math.ceil(total / (query.limit ?? 20)),
      },
    };
  }

  async findOne(userId: string, id: string) {
    const entry = await this.prisma.activityEntry.findFirst({
      where: { id, userId },
      include: { activity: true },
    });

    if (!entry) {
      throw new NotFoundException('Entry not found');
    }

    return entry;
  }

  async update(userId: string, id: string, dto: UpdateEntryDto) {
    const entry = await this.prisma.activityEntry.findFirst({
      where: { id, userId },
    });

    if (!entry) {
      throw new NotFoundException('Entry not found');
    }

    if (entry.status === EntryStatus.CANCELLED) {
      throw new ForbiddenException('Cannot update a cancelled entry');
    }

    return this.prisma.activityEntry.update({
      where: { id },
      data: {
        ...(dto.data && { data: dto.data as Prisma.InputJsonValue }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.status && { status: dto.status }),
      },
      include: { activity: true },
    });
  }

  async correct(userId: string, id: string, data: Record<string, unknown>, notes?: string) {
    const original = await this.prisma.activityEntry.findFirst({
      where: { id, userId },
    });

    if (!original) {
      throw new NotFoundException('Entry not found');
    }

    return this.prisma.activityEntry.update({
      where: { id },
      data: {
        status: EntryStatus.CORRECTED,
      },
    });
  }

  async delete(userId: string, id: string) {
    const entry = await this.prisma.activityEntry.findFirst({
      where: { id, userId },
    });

    if (!entry) {
      throw new NotFoundException('Entry not found');
    }

    await this.prisma.activityEntry.delete({ where: { id } });

    return { success: true };
  }

  async getStats(userId: string, activityId?: string, from?: Date, to?: Date) {
    const where: Record<string, unknown> = { userId, status: EntryStatus.ACTIVE };

    if (activityId) {
      where.activityId = activityId;
    }

    if (from || to) {
      where.loggedAt = {};
      if (from) {
        (where.loggedAt as Record<string, Date>).gte = from;
      }
      if (to) {
        (where.loggedAt as Record<string, Date>).lte = to;
      }
    }

    const entries = await this.prisma.activityEntry.findMany({
      where,
      select: { data: true, activityType: true, loggedAt: true },
    });

    const timeEntries = entries.filter(e => e.activityType === ActivityType.TIME);
    const totalTimeSeconds = timeEntries.reduce((sum, e) => {
      const duration = (e.data as Record<string, unknown>)?.duration as number;
      return sum + (duration ?? 0);
    }, 0);

    return {
      totalEntries: entries.length,
      totalTimeSeconds,
      totalTimeFormatted: this.formatDuration(totalTimeSeconds),
    };
  }

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}
