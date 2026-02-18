import { Module } from '@nestjs/common';
import { IntentionsController } from './intentions.controller';
import { IntentionsService } from './intentions.service';

@Module({
  controllers: [IntentionsController],
  providers: [IntentionsService],
  exports: [IntentionsService],
})
export class IntentionsModule {}
