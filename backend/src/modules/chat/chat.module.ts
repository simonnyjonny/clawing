import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ChatGateway } from './chat.gateway';
import { OpenClawModule } from '../openclaw/openclaw.module';

@Module({
  imports: [
    JwtModule.register({
      secret: 'dev-secret-key-change-in-production',
      signOptions: { expiresIn: '7d' },
    }),
    OpenClawModule,
  ],
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class ChatModule {}
