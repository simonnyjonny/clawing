import { Module } from '@nestjs/common';
import { BindingService } from './binding.service';
import { BindingController } from './binding.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [BindingController],
  providers: [BindingService, PrismaService],
  exports: [BindingService],
})
export class BindingModule {}
