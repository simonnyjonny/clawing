import { Controller, Get, Post, Patch, Body, Param, Request, UseGuards } from '@nestjs/common';
import { QualificationService } from './qualification.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('qualifications')
export class QualificationController {
  constructor(private readonly qualificationService: QualificationService) {}

  @Post(':bindingId')
  @UseGuards(AuthGuard('jwt'))
  async apply(@Request() req: any, @Param('bindingId') bindingId: string) {
    const prisma = new (await import('../../database/prisma.service')).PrismaService();
    const operator = await prisma.operator.findUnique({
      where: { accountId: req.user.sub },
    });
    if (!operator) {
      throw new Error('只有主理人才能申请开播');
    }
    return this.qualificationService.apply(operator.id, bindingId);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getMyQualifications(@Request() req: any) {
    const prisma = new (await import('../../database/prisma.service')).PrismaService();
    const operator = await prisma.operator.findUnique({
      where: { accountId: req.user.sub },
    });
    if (!operator) {
      return [];
    }
    return this.qualificationService.getMyQualifications(operator.id);
  }
}
