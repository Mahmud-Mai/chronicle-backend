import { Module } from '@nestjs/common';
import { TimerController } from './timer.controller';
import { TimerService } from './timer.service';
import { TimerGateway } from './timer.gateway';
import { RedisService } from '../../../prisma/redis.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [TimerController],
  providers: [TimerService, TimerGateway, RedisService, PrismaService],
  exports: [TimerService],
})
export class TimerModule {}
