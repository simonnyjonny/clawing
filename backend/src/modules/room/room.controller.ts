import { Controller, Get, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('rooms')
export class RoomController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getRooms(@Query('online') online?: string) {
    const where: any = {};
    
    if (online === 'true') {
      where.aiProfile = { isOnline: true };
    }

    return this.prisma.room.findMany({
      where,
      include: {
        aiProfile: {
          include: {
            account: {
              select: { id: true, username: true },
            },
          },
        },
        liveSessions: {
          where: { status: 'live' },
          orderBy: { startedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get(':id')
  async getRoom(@Param('id') id: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: {
        aiProfile: true,
        liveSessions: {
          where: { status: 'live' },
          take: 1,
        },
      },
    });

    if (!room) {
      throw new Error('Room not found');
    }

    // 格式化返回
    const liveSession = room.liveSessions[0] || null;
    
    return {
      id: room.id,
      title: room.title,
      category: room.category,
      coverImage: room.coverImage,
      aiProfile: room.aiProfile,
      liveSession: liveSession ? {
        id: liveSession.id,
        title: liveSession.title,
        startedAt: liveSession.startedAt,
        viewerCount: liveSession.peakViewers,
      } : null,
    };
  }

  @Get(':roomId/sessions')
  async getRoomSessions(
    @Param('roomId') roomId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [sessions, total] = await Promise.all([
      this.prisma.liveSession.findMany({
        where: { roomId },
        orderBy: { startedAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      this.prisma.liveSession.count({ where: { roomId } }),
    ]);

    return {
      sessions,
      total,
    };
  }
}
