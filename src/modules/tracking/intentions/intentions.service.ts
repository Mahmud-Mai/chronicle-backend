import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateIntentionDto, UpdateIntentionDto, IntentionQueryDto } from './dto/intention.dto';

@Injectable()
export class IntentionsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateIntentionDto) {
    const activity = await this.prisma.activity.findFirst({
      where: { id: dto.activityId, userId },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    return this.prisma.intention.create({
      data: {
        userId,
        activityId: dto.activityId,
        scheduledStart: new Date(dto.scheduledStart),
        scheduledEnd: new Date(dto.scheduledEnd),
        notes: dto.notes,
      },
      include: { activity: true },
    });
  }

  async findAll(userId: string, query: IntentionQueryDto) {
    const where: Record<string, unknown> = { userId };

    if (query.activityId) {
      where.activityId = query.activityId;
    }

    if (query.completed !== undefined) {
      where.completed = query.completed;
    }

    if (query.from || query.to) {
      where.scheduledStart = {};
      if (query.from) {
        (where.scheduledStart as Record<string, Date>).gte = new Date(query.from);
      }
      if (query.to) {
        (where.scheduledStart as Record<string, Date>).lte = new Date(query.to);
      }
    }

    const [intentions, total] = await Promise.all([
      this.prisma.intention.findMany({
        where,
        include: { activity: true },
        orderBy: { scheduledStart: 'asc' },
        skip: ((query.page ?? 1) - 1) * (query.limit ?? 20),
        take: query.limit ?? 20,
      }),
      this.prisma.intention.count({ where }),
    ]);

    return {
      data: intentions,
      meta: {
        total,
        page: query.page ?? 1,
        limit: query.limit ?? 20,
        totalPages: Math.ceil(total / (query.limit ?? 20)),
      },
    };
  }

  async findOne(userId: string, id: string) {
    const intention = await this.prisma.intention.findFirst({
      where: { id, userId },
      include: { activity: true },
    });

    if (!intention) {
      throw new NotFoundException('Intention not found');
    }

    return intention;
  }

  async update(userId: string, id: string, dto: UpdateIntentionDto) {
    const intention = await this.prisma.intention.findFirst({
      where: { id, userId },
    });

    if (!intention) {
      throw new NotFoundException('Intention not found');
    }

    return this.prisma.intention.update({
      where: { id },
      data: {
        ...(dto.scheduledStart && { scheduledStart: new Date(dto.scheduledStart) }),
        ...(dto.scheduledEnd && { scheduledEnd: new Date(dto.scheduledEnd) }),
        ...(dto.completed !== undefined && { completed: dto.completed }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      include: { activity: true },
    });
  }

  async toggleComplete(userId: string, id: string) {
    const intention = await this.prisma.intention.findFirst({
      where: { id, userId },
    });

    if (!intention) {
      throw new NotFoundException('Intention not found');
    }

    return this.prisma.intention.update({
      where: { id },
      data: { completed: !intention.completed },
      include: { activity: true },
    });
  }

  async delete(userId: string, id: string) {
    const intention = await this.prisma.intention.findFirst({
      where: { id, userId },
    });

    if (!intention) {
      throw new NotFoundException('Intention not found');
    }

    await this.prisma.intention.delete({ where: { id } });

    return { success: true };
  }

  async getToday(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.intention.findMany({
      where: {
        userId,
        scheduledStart: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: { activity: true },
      orderBy: { scheduledStart: 'asc' },
    });
  }

  async getUpcoming(userId: string, days: number = 7) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + days);

    return this.prisma.intention.findMany({
      where: {
        userId,
        scheduledStart: {
          gte: today,
          lt: endDate,
        },
        completed: false,
      },
      include: { activity: true },
      orderBy: { scheduledStart: 'asc' },
    });
  }
}
