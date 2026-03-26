import { Controller, Get, Post, Patch, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { OperatorService } from '../operator/operator.service';
import { BindingService } from '../binding/binding.service';
import { QualificationService } from '../qualification/qualification.service';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../../database/prisma.service';

@Controller('admin')
@UseGuards(AuthGuard('jwt'))
export class AdminController {
  constructor(
    private operatorService: OperatorService,
    private bindingService: BindingService,
    private qualificationService: QualificationService,
    private prisma: PrismaService,
  ) {}

  // Check if admin
  private async checkAdmin(accountId: string): Promise<boolean> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });
    return account?.accountType === 'admin';
  }

  // Operators
  @Get('operators')
  async getOperators(@Request() req: any) {
    if (!(await this.checkAdmin(req.user.sub))) {
      throw new Error('权限不足');
    }
    return this.operatorService.getAll();
  }

  @Patch('operators/:id/approve')
  async approveOperator(@Param('id') id: string, @Request() req: any) {
    if (!(await this.checkAdmin(req.user.sub))) {
      throw new Error('权限不足');
    }
    return this.operatorService.approve(id, req.user.sub);
  }

  @Patch('operators/:id/reject')
  async rejectOperator(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Request() req: any,
  ) {
    if (!(await this.checkAdmin(req.user.sub))) {
      throw new Error('权限不足');
    }
    return this.operatorService.reject(id, body.reason);
  }

  // Bindings
  @Get('bindings')
  async getBindings(@Request() req: any, @Body() body: { status?: string }) {
    if (!(await this.checkAdmin(req.user.sub))) {
      throw new Error('权限不足');
    }
    return this.bindingService.getAll(body.status);
  }

  @Patch('bindings/:id/approve')
  async approveBinding(@Param('id') id: string, @Request() req: any) {
    if (!(await this.checkAdmin(req.user.sub))) {
      throw new Error('权限不足');
    }
    return this.bindingService.approve(id, req.user.sub);
  }

  @Patch('bindings/:id/reject')
  async rejectBinding(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Request() req: any,
  ) {
    if (!(await this.checkAdmin(req.user.sub))) {
      throw new Error('权限不足');
    }
    return this.bindingService.reject(id, body.reason);
  }

  // Qualifications
  @Get('qualifications')
  async getQualifications(@Request() req: any, @Body() body: { isAllowed?: boolean }) {
    if (!(await this.checkAdmin(req.user.sub))) {
      throw new Error('权限不足');
    }
    return this.qualificationService.getAll(body.isAllowed);
  }

  @Patch('qualifications/:bindingId/approve')
  async approveQualification(@Param('bindingId') bindingId: string, @Request() req: any) {
    if (!(await this.checkAdmin(req.user.sub))) {
      throw new Error('权限不足');
    }
    return this.qualificationService.approve(bindingId);
  }

  @Patch('qualifications/:bindingId/revoke')
  async revokeQualification(
    @Param('bindingId') bindingId: string,
    @Body() body: { reason: string },
    @Request() req: any,
  ) {
    if (!(await this.checkAdmin(req.user.sub))) {
      throw new Error('权限不足');
    }
    return this.qualificationService.revoke(bindingId, body.reason);
  }

  // Sensitive Words
  @Get('sensitive-words')
  async getSensitiveWords(@Request() req: any) {
    if (!(await this.checkAdmin(req.user.sub))) {
      throw new Error('权限不足');
    }
    return this.prisma.sensitiveWord.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('sensitive-words')
  async createSensitiveWord(
    @Request() req: any,
    @Body() body: { word: string; level?: string; replacement?: string },
  ) {
    if (!(await this.checkAdmin(req.user.sub))) {
      throw new Error('权限不足');
    }
    return this.prisma.sensitiveWord.create({
      data: {
        word: body.word,
        level: (body.level as any) || 'warn',
        replacement: body.replacement,
        createdById: req.user.sub,
      },
    });
  }

  @Delete('sensitive-words/:id')
  async deleteSensitiveWord(@Param('id') id: string, @Request() req: any) {
    if (!(await this.checkAdmin(req.user.sub))) {
      throw new Error('权限不足');
    }
    return this.prisma.sensitiveWord.delete({ where: { id } });
  }

  // Overview Stats
  @Get('overview')
  async getOverview(@Request() req: any) {
    if (!(await this.checkAdmin(req.user.sub))) {
      throw new Error('权限不足');
    }

    const [totalOperators, totalAIProfiles, totalRooms, activeLiveSessions, pendingOperators, pendingBindings, pendingQualifications] = await Promise.all([
      this.prisma.operator.count(),
      this.prisma.aiProfile.count(),
      this.prisma.room.count(),
      this.prisma.liveSession.count({ where: { status: 'live' } }),
      this.prisma.operator.count({ where: { status: 'pending' } }),
      this.prisma.openClawBinding.count({ where: { status: 'pending' } }),
      this.prisma.broadcastQualification.count({ where: { isAllowed: false } }),
    ]);

    return {
      totalOperators,
      totalAIProfiles,
      totalRooms,
      activeLiveSessions,
      pendingOperators,
      pendingBindings,
      pendingQualifications,
    };
  }
}
