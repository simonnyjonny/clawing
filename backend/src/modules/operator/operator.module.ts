import { Module } from '@nestjs/common';
import { OperatorService } from './operator.service';
import { OperatorController } from './operator.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [OperatorController],
  providers: [OperatorService, PrismaService],
  exports: [OperatorService],
})
export class OperatorModule {}
