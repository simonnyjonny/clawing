import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { OpenClawBridgeProvider } from '../openclaw/openclaw-bridge.provider';

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server: Server;

  private aiCooldowns: Map<string, number> = new Map();
  private readonly AI_COOLDOWN_MS = 3000;

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private openClawProvider: OpenClawBridgeProvider,
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.auth.token;
    
    if (token) {
      try {
        const user = this.jwtService.verify(token);
        client.data.accountId = user.sub;
        client.data.accountType = user.accountType;
        client.data.username = user.username;
      } catch {
        client.data.accountType = 'anonymous';
      }
    } else {
      client.data.accountType = 'anonymous';
    }
  }

  handleDisconnect(client: Socket) {
    console.log('handleDisconnect called for client', client.id);
    const joinedRooms: Set<string> = client.data.joinedRooms || new Set();
    for (const roomId of joinedRooms) {
      setTimeout(() => {
        this.broadcastViewerCount(roomId);
      }, 100);
    }
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    const { roomId } = data;

    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      client.emit('error', { code: 'ROOM_NOT_FOUND', message: '房间不存在' });
      return;
    }

    await client.join(roomId);
    
    if (!client.data.joinedRooms) {
      client.data.joinedRooms = new Set();
    }
    client.data.joinedRooms.add(roomId);

    if (client.data.accountId && client.data.accountType !== 'admin') {
      await this.prisma.roomParticipant.upsert({
        where: {
          roomId_accountId: { roomId, accountId: client.data.accountId },
        },
        update: {},
        create: { roomId, accountId: client.data.accountId },
      });
    }

    setTimeout(() => {
      this.broadcastViewerCount(roomId);
    }, 100);

    return { success: true };
  }

  @SubscribeMessage('leave_room')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    const { roomId } = data;

    client.leave(roomId);
    
    if (client.data.joinedRooms) {
      client.data.joinedRooms.delete(roomId);
    }

    if (client.data.accountId && client.data.accountType !== 'admin') {
      const adapter = (this.server as any).adapter;
      const roomClients = adapter?.rooms?.get(roomId);
      const hasOtherSameUser = Array.from(roomClients || []).some(
        (sid: string) => sid !== client.id && (this.server.sockets.sockets.get(sid)?.data?.accountId as string) === client.data.accountId
      );

      if (!hasOtherSameUser) {
        await this.prisma.roomParticipant.deleteMany({
          where: { roomId, accountId: client.data.accountId },
        });
      }
    }

    setTimeout(() => {
      this.broadcastViewerCount(roomId);
    }, 100);
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; content: string },
  ) {
    if (client.data.accountType === 'anonymous') {
      client.emit('error', { code: 'UNAUTHORIZED', message: '请先登录' });
      return;
    }

    if (client.data.accountType === 'admin') {
      client.emit('error', { code: 'FORBIDDEN', message: '管理员不能发送消息' });
      return;
    }

    const { roomId, content } = data;

    if (!content.trim()) {
      return;
    }

    const liveSession = await this.prisma.liveSession.findFirst({
      where: { roomId, status: 'live' },
    });

    const message = await this.prisma.message.create({
      data: {
        roomId,
        liveSessionId: liveSession?.id || null,
        senderAccountId: client.data.accountId,
        content: content.trim(),
        type: 'text',
        isAudited: true,
        auditResult: 'pass',
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            accountType: true,
            humanProfile: { select: { avatar: true } },
            aiProfile: { select: { avatar: true, name: true } },
          },
        },
      },
    });

    const formatted = {
      id: message.id,
      roomId: message.roomId,
      liveSessionId: message.liveSessionId,
      sender: {
        accountId: message.sender.id,
        username: message.sender.accountType === 'ai' 
          ? message.sender.aiProfile?.name 
          : message.sender.username,
        accountType: message.sender.accountType,
        avatar: message.sender.accountType === 'ai' 
          ? message.sender.aiProfile?.avatar 
          : message.sender.humanProfile?.avatar,
      },
      content: message.content,
      type: message.type,
      auditResult: message.auditResult,
      createdAt: message.createdAt,
    };

    this.server.to(roomId).emit('message', formatted);

    if (liveSession) {
      this.triggerAIReply(roomId, liveSession.id, content);
    }

    return { success: true };
  }

  private async triggerAIReply(roomId: string, liveSessionId: string, userMessage: string) {
    const key = `${roomId}`;
    const now = Date.now();
    const lastReply = this.aiCooldowns.get(key) || 0;

    if (now - lastReply < this.AI_COOLDOWN_MS) {
      return;
    }

    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: { aiProfile: true },
    });

    if (!room?.aiProfile?.isOnline) {
      return;
    }

    const shouldReply = Math.random() < 0.3;
    if (!shouldReply && !userMessage.includes('?')) {
      return;
    }

    this.aiCooldowns.set(key, now);

    const openClawResponse = await this.openClawProvider.sendMessage(
      room.aiProfile.id,
      userMessage,
      roomId,
    );

    let replyContent: string;
    const isFromOpenClaw = openClawResponse.success && 
                           openClawResponse.content && 
                           !openClawResponse.isMock;

    if (isFromOpenClaw) {
      replyContent = openClawResponse.content!;
      this.logger.log(`[OpenClaw] AI ${room.aiProfile.name} replied: ${replyContent.substring(0, 50)}...`);
    } else {
      const replies = [
        `你好呀！${room.aiProfile.name}在这里~`,
        '谢谢你的发言！',
        '今天过得怎么样？',
        '有什么想聊的吗？',
        '我很高兴你能来我的直播间！',
        '我们来聊聊天吧~',
      ];
      replyContent = replies[Math.floor(Math.random() * replies.length)];
      this.logger.warn(`[Mock Fallback] Using mock response for AI ${room.aiProfile.name}: ${replyContent}`);
    }

    const aiMessage = await this.prisma.message.create({
      data: {
        roomId,
        liveSessionId,
        senderAccountId: room.aiProfile.accountId,
        content: replyContent,
        type: 'ai_reply',
        isAudited: true,
        auditResult: 'pass',
        metadata: isFromOpenClaw ? { source: 'openclaw' } : { source: 'mock' },
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            accountType: true,
            aiProfile: { select: { avatar: true, name: true } },
          },
        },
      },
    });

    const formatted = {
      id: aiMessage.id,
      roomId: aiMessage.roomId,
      liveSessionId: aiMessage.liveSessionId,
      sender: {
        accountId: aiMessage.sender.id,
        username: aiMessage.sender.aiProfile?.name || 'AI',
        accountType: 'ai',
        avatar: aiMessage.sender.aiProfile?.avatar,
      },
      content: aiMessage.content,
      type: aiMessage.type,
      auditResult: aiMessage.auditResult,
      createdAt: aiMessage.createdAt,
    };

    this.server.to(roomId).emit('message', formatted);
  }

  private async broadcastViewerCount(roomId: string) {
    try {
      const sockets = await this.server.in(roomId).fetchSockets();
      const count = sockets.length;
      
      console.log('broadcastViewerCount for room', roomId, 'count:', count, 'sockets:', sockets.map(s => s.id));

      this.server.to(roomId).emit('viewer_count', {
        roomId,
        count,
      });
    } catch (e) {
      console.log('broadcastViewerCount error:', e);
    }
  }
}
