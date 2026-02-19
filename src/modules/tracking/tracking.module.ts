import { Module } from '@nestjs/common';
import { TrackingController } from './tracking.controller';
import { TrackingService } from './tracking.service';
import { TimerModule } from './timer/timer.module';
import { IntentionsModule } from './intentions/intentions.module';
import { EntriesModule } from './entries/entries.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, TimerModule, IntentionsModule, EntriesModule],
  controllers: [TrackingController],
  providers: [TrackingService],
  exports: [TrackingService],
})
export class TrackingModule {}
