import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateActivityDto, UpdateActivityDto } from './dto/activity.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ActivityService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateActivityDto) {
    return this.prisma.activity.create({
      data: {
        userId,
        name: dto.name,
        type: dto.type,
        config: (dto.config || {}) as Prisma.JsonObject,
        color: dto.color || '#6366f1',
        icon: dto.icon || '📊',
      },
    });
  }

  async findAll(userId: string, includeArchived = false) {
    return this.prisma.activity.findMany({
      where: {
        userId,
        ...(includeArchived ? {} : { isArchived: false }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const activity = await this.prisma.activity.findFirst({
      where: { id, userId },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    return activity;
  }

  async update(userId: string, id: string, dto: UpdateActivityDto) {
    await this.findOne(userId, id);

    const updateData: Prisma.ActivityUpdateInput = {};
    
    if (dto.name) updateData.name = dto.name;
    if (dto.config) updateData.config = dto.config as Prisma.JsonObject;
    if (dto.color) updateData.color = dto.color;
    if (dto.icon) updateData.icon = dto.icon;
    if (dto.isArchived !== undefined) updateData.isArchived = dto.isArchived;

    return this.prisma.activity.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    await this.prisma.activity.update({
      where: { id },
      data: { isArchived: true },
    });

    return { success: true };
  }
}
