import { Module } from '@nestjs/common';
import { TrackingController } from './tracking.controller';
import { TrackingService } from './tracking.service';
import { TimerModule } from './timer/timer.module';
import { IntentionsModule } from './intentions/intentions.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, TimerModule, IntentionsModule],
  controllers: [TrackingController],
  providers: [TrackingService],
  exports: [TrackingService],
})
export class TrackingModule {}
