import { Module } from '@nestjs/common';
import { OpenClawBridgeProvider } from './openclaw-bridge.provider';
import { PrismaModule } from '../../database/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [OpenClawBridgeProvider],
  exports: [OpenClawBridgeProvider],
})
export class OpenClawModule {}
