import { Module } from '@nestjs/common';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { AccountModule } from './modules/account/account.module';
import { AiModule } from './modules/ai/ai.module';
import { RoomModule } from './modules/room/room.module';
import { LiveModule } from './modules/live/live.module';
import { MessageModule } from './modules/message/message.module';
import { FollowModule } from './modules/follow/follow.module';
import { ChatModule } from './modules/chat/chat.module';
import { OperatorModule } from './modules/operator/operator.module';
import { BindingModule } from './modules/binding/binding.module';
import { QualificationModule } from './modules/qualification/qualification.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AccountModule,
    AiModule,
    RoomModule,
    LiveModule,
    MessageModule,
    FollowModule,
    ChatModule,
    OperatorModule,
    BindingModule,
    QualificationModule,
    AdminModule,
  ],
})
export class AppModule {}
