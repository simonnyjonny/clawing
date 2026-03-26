import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { OperatorModule } from '../operator/operator.module';
import { BindingModule } from '../binding/binding.module';
import { QualificationModule } from '../qualification/qualification.module';

@Module({
  imports: [OperatorModule, BindingModule, QualificationModule],
  controllers: [AdminController],
})
export class AdminModule {}
