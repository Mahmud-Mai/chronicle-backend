import { Module } from '@nestjs/common';
import { IntentionsController } from './intentions.controller';
import { IntentionsService } from './intentions.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [IntentionsController],
  providers: [IntentionsService, PrismaService],
  exports: [IntentionsService],
})
export class IntentionsModule {}
