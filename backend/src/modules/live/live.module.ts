import { Module } from '@nestjs/common';
import { LiveController } from './live.controller';

@Module({
  controllers: [LiveController],
  providers: [],
})
export class LiveModule {}
