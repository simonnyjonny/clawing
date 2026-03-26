import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuthGuard } from '@nestjs/passport';
import { AccountType } from '@prisma/client';

@Controller('follows')
export class FollowController {
  constructor(private prisma: PrismaService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async getMyFollows(@Request() req: any) {
    const follows = await this.prisma.follow.findMany({
      where: { followerAccountId: req.user.sub },
      include: {
        following: {
          include: {
            aiProfile: {
              include: { room: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return follows.map((f) => ({
      id: f.id,
      followingAccountId: f.followingAccountId,
      following: f.following.aiProfile ? {
        accountId: f.followingAccountId,
        name: f.following.aiProfile.name,
        avatar: f.following.aiProfile.avatar,
        isOnline: f.following.aiProfile.isOnline,
        room: f.following.aiProfile.room,
      } : null,
    }));
  }

  @Get(':accountId/followers')
  async getFollowers(@Param('accountId') accountId: string) {
    const followers = await this.prisma.follow.findMany({
      where: { followingAccountId: accountId },
      include: {
        follower: {
          include: { humanProfile: true },
        },
      },
    });

    return followers.map((f) => ({
      id: f.id,
      follower: {
        accountId: f.followerAccountId,
        username: f.follower.username,
        avatar: f.follower.humanProfile?.avatar,
      },
    }));
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async follow(
    @Body() data: { targetAccountId: string },
    @Request() req: any,
  ) {
    const follower = await this.prisma.account.findUnique({
      where: { id: req.user.sub },
    });

    if (!follower || follower.accountType !== AccountType.human) {
      throw new Error('只有人类用户可以关注');
    }

    // 检查目标账号是否存在且为 AI
    const target = await this.prisma.account.findUnique({
      where: { id: data.targetAccountId },
    });

    if (!target || target.accountType !== AccountType.ai) {
      throw new Error('只能关注 AI 账号');
    }

    if (follower.id === data.targetAccountId) {
      throw new Error('不能关注自己');
    }

    // 检查是否已关注
    const existing = await this.prisma.follow.findFirst({
      where: {
        followerAccountId: req.user.sub,
        followingAccountId: data.targetAccountId,
      },
    });

    if (existing) {
      throw new Error('已经关注过了');
    }

    const follow = await this.prisma.follow.create({
      data: {
        followerAccountId: req.user.sub,
        followingAccountId: data.targetAccountId,
      },
    });

    return follow;
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async unfollow(@Param('id') id: string, @Request() req: any) {
    const follow = await this.prisma.follow.findUnique({
      where: { id },
    });

    if (!follow || follow.followerAccountId !== req.user.sub) {
      throw new Error('关注记录不存在');
    }

    await this.prisma.follow.delete({
      where: { id },
    });

    return { success: true };
  }
}
