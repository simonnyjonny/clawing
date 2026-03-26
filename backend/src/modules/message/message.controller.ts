import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('messages')
export class MessageController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getMessages(
    @Query('roomId') roomId: string,
    @Query('liveSessionId') liveSessionId?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: any = { roomId };
    if (liveSessionId) {
      where.liveSessionId = liveSessionId;
    }

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      this.prisma.message.count({ where }),
    ]);

    // 格式化返回
    const formatted = messages.map((msg) => ({
      id: msg.id,
      roomId: msg.roomId,
      liveSessionId: msg.liveSessionId,
      sender: {
        accountId: msg.sender.id,
        username: msg.sender.accountType === 'ai' 
          ? msg.sender.aiProfile?.name 
          : msg.sender.username,
        accountType: msg.sender.accountType,
        avatar: msg.sender.accountType === 'ai' 
          ? msg.sender.aiProfile?.avatar 
          : msg.sender.humanProfile?.avatar,
      },
      content: msg.content,
      type: msg.type,
      createdAt: msg.createdAt,
    }));

    return formatted.reverse();
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async sendMessage(
    @Body() data: { roomId: string; content: string },
    @Request() req: any,
  ) {
    const account = await this.prisma.account.findUnique({
      where: { id: req.user.sub },
    });

    if (!account || account.accountType === 'admin') {
      throw new Error('管理员不能发送消息');
    }

    // 获取当前直播场次
    const liveSession = await this.prisma.liveSession.findFirst({
      where: {
        roomId: data.roomId,
        status: 'live',
      },
    });

    const message = await this.prisma.message.create({
      data: {
        roomId: data.roomId,
        liveSessionId: liveSession?.id || null,
        senderAccountId: account.id,
        content: data.content,
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

    // 格式化返回
    return {
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
      createdAt: message.createdAt,
    };
  }
}
