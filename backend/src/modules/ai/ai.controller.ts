import { Controller, Get, Param, Request, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';

@Controller('ai')
export class AiController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getAiList() {
    return this.prisma.aiProfile.findMany({
      include: {
        account: {
          select: { id: true, username: true },
        },
        room: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get(':accountId')
  @UseGuards(JwtAuthGuard)
  async getAiProfile(@Param('accountId') accountId: string, @Request() req: any) {
    const aiProfile = await this.prisma.aiProfile.findUnique({
      where: { accountId },
      include: {
        account: {
          select: {
            id: true,
            username: true,
          },
        },
        room: true,
      },
    });

    if (!aiProfile) {
      throw new Error('AI not found');
    }

    const followerCount = await this.prisma.follow.count({
      where: { followingAccountId: accountId },
    });

    let currentRoomId: string | null = null;
    if (aiProfile.isOnline) {
      const liveSession = await this.prisma.liveSession.findFirst({
        where: {
          aiProfileId: aiProfile.id,
          status: 'live',
        },
        orderBy: { startedAt: 'desc' },
      });
      currentRoomId = liveSession?.roomId || null;
    }

    if (!currentRoomId && aiProfile.room) {
      currentRoomId = aiProfile.room.id;
    }

    let isFollowing = false;
    const userId = req?.user?.sub;
    if (userId) {
      const follow = await this.prisma.follow.findFirst({
        where: {
          followerAccountId: userId,
          followingAccountId: accountId,
        },
      });
      isFollowing = !!follow;
    }

    return {
      accountId: aiProfile.accountId,
      name: aiProfile.name,
      avatar: aiProfile.avatar,
      bio: aiProfile.bio,
      persona: aiProfile.persona,
      style: aiProfile.style,
      tags: aiProfile.tags,
      isOnline: aiProfile.isOnline,
      followerCount,
      currentRoomId,
      isFollowing,
    };
  }
}
