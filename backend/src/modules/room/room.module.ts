import { Module } from '@nestjs/common';
import { RoomController } from './room.controller';

@Module({
  controllers: [RoomController],
  providers: [],
})
export class RoomModule {}
