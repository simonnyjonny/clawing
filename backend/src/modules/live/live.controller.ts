import { Controller, Get, Post, Param, Body, UseGuards, Request, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('live-sessions')
export class LiveController {
  constructor(private prisma: PrismaService) {}

  @Get('active')
  async getActiveSessions() {
    return this.prisma.liveSession.findMany({
      where: { status: 'live' },
      include: {
        room: {
          include: {
            aiProfile: true,
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  @Get(':id')
  async getSession(@Param('id') id: string) {
    const session = await this.prisma.liveSession.findUnique({
      where: { id },
      include: {
        room: true,
        aiProfile: true,
      },
    });
    return session;
  }

  // Check if an AI can start live broadcast
  private async canStartLive(aiProfileId: string): Promise<{ allowed: boolean; reason?: string }> {
    // Check if AI is bound
    const binding = await this.prisma.openClawBinding.findUnique({
      where: { aiProfileId },
    });

    if (!binding) {
      return { allowed: false, reason: '该AI未绑定主理人' };
    }

    if (binding.status !== 'approved') {
      return { allowed: false, reason: '绑定审核未通过' };
    }

    // Check qualification
    const qualification = await this.prisma.broadcastQualification.findUnique({
      where: { bindingId: binding.id },
    });

    if (!qualification || !qualification.isAllowed) {
      return { allowed: false, reason: '该AI未获得开播资格' };
    }

    return { allowed: true };
  }

  // Check if admin bypass is enabled
  private isAdminBypassEnabled(): boolean {
    // Only enable admin bypass in development mode
    return process.env.NODE_ENV !== 'production';
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('start')
  async startLive(
    @Body() data: { aiProfileId: string; title: string },
    @Request() req: any,
  ) {
    const account = await this.prisma.account.findUnique({
      where: { id: req.user.sub },
    });

    const adminBypassEnabled = this.isAdminBypassEnabled();

    // Check if user is admin and bypass is enabled
    if (account?.accountType === 'admin' && adminBypassEnabled) {
      // Admin can start any AI only in dev/test mode
      console.log(`[Admin Bypass] Admin ${account.username} starting live for AI ${data.aiProfileId} (dev mode)`);
    } else if (account?.accountType === 'admin' && !adminBypassEnabled) {
      // In production, admin must also follow the rules
      const canStart = await this.canStartLive(data.aiProfileId);
      if (!canStart.allowed) {
        throw new ForbiddenException(canStart.reason);
      }
    } else if (account?.accountType === 'human') {
      // For human users, check if they are the operator of this AI
      const aiProfile = await this.prisma.aiProfile.findUnique({
        where: { id: data.aiProfileId },
        include: {
          openclawBinding: true,
        },
      });

      if (!aiProfile) {
        throw new BadRequestException('AI不存在');
      }

      // Check if user is the operator
      if (aiProfile.openclawBinding?.operatorId) {
        const operator = await this.prisma.operator.findFirst({
          where: {
            id: aiProfile.openclawBinding.operatorId,
            accountId: req.user.sub,
            status: 'approved',
          },
        });

        if (!operator) {
          throw new ForbiddenException('您没有权限开启此AI的直播');
        }
      } else {
        throw new ForbiddenException('该AI未绑定主理人，无法开播');
      }

      // Now check if AI has qualification
      const canStart = await this.canStartLive(data.aiProfileId);
      if (!canStart.allowed) {
        throw new BadRequestException(canStart.reason);
      }
    } else {
      throw new ForbiddenException('只有管理员或主理人可以开启直播');
    }

    const aiProfile = await this.prisma.aiProfile.findUnique({
      where: { id: data.aiProfileId },
    });

    if (!aiProfile) {
      throw new BadRequestException('AI不存在');
    }

    const existingSession = await this.prisma.liveSession.findFirst({
      where: {
        aiProfileId: data.aiProfileId,
        status: 'live',
      },
    });

    if (existingSession) {
      throw new BadRequestException('该AI已在直播中');
    }

    const room = await this.prisma.room.findUnique({
      where: { aiProfileId: data.aiProfileId },
    });

    if (!room) {
      throw new BadRequestException('房间不存在');
    }

    const session = await this.prisma.liveSession.create({
      data: {
        roomId: room.id,
        aiProfileId: data.aiProfileId,
        title: data.title,
        status: 'live',
        startedAt: new Date(),
      },
    });

    await this.prisma.aiProfile.update({
      where: { id: data.aiProfileId },
      data: { isOnline: true },
    });

    return session;
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/stop')
  async stopLive(@Param('id') id: string, @Request() req: any) {
    const account = await this.prisma.account.findUnique({
      where: { id: req.user.sub },
    });

    const adminBypassEnabled = this.isAdminBypassEnabled();

    // Similar logic for stopping live
    if (account?.accountType === 'admin' && adminBypassEnabled) {
      // Admin bypass in dev mode
    } else if (account?.accountType !== 'admin') {
      // Also allow operator to stop their own AI's live
      const session = await this.prisma.liveSession.findUnique({
        where: { id },
        include: { aiProfile: { include: { openclawBinding: true } } },
      });

      if (!session) {
        throw new BadRequestException('直播场次不存在');
      }

      if (session.aiProfile.openclawBinding?.operatorId) {
        const operator = await this.prisma.operator.findFirst({
          where: {
            id: session.aiProfile.openclawBinding.operatorId,
            accountId: req.user.sub,
          },
        });

        if (!operator) {
          throw new ForbiddenException('您没有权限停止此直播');
        }
      } else if (!adminBypassEnabled) {
        throw new ForbiddenException('只有管理员可以停止直播');
      }
    }

    const session = await this.prisma.liveSession.findUnique({
      where: { id },
      include: { aiProfile: true },
    });

    if (!session) {
      throw new BadRequestException('直播场次不存在');
    }

    const updated = await this.prisma.liveSession.update({
      where: { id },
      data: {
        status: 'ended',
        endedAt: new Date(),
      },
    });

    await this.prisma.aiProfile.update({
      where: { id: session.aiProfileId },
      data: { isOnline: false },
    });

    return updated;
  }
}
