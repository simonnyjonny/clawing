import { Controller, Get, Post, Body, Param, Request, UseGuards } from '@nestjs/common';
import { BindingService } from './binding.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('bindings')
export class BindingController {
  constructor(private readonly bindingService: BindingService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async apply(@Request() req: any, @Body() body: {
    aiProfileId: string;
    openclawId: string;
    openclawName: string;
    openclawEndpoint?: string;
    authType?: string;
    authToken?: string;
  }) {
    const operator = req.user.operator;
    if (!operator) {
      // Get operator by accountId
      const { OperatorService } = await import('../operator/operator.service');
      const { PrismaService } = await import('../../database/prisma.service');
      const prisma = new PrismaService();
      const op = await prisma.operator.findUnique({
        where: { accountId: req.user.sub },
      });
      if (!op || op.status !== 'approved') {
        throw new Error('只有已审核通过的主理人才能绑定AI');
      }
      return this.bindingService.apply(op.id, body);
    }
    return this.bindingService.apply(operator.id, body);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getMyBindings(@Request() req: any) {
    const prisma = new (await import('../../database/prisma.service')).PrismaService();
    const operator = await prisma.operator.findUnique({
      where: { accountId: req.user.sub },
    });
    if (!operator) {
      return [];
    }
    return this.bindingService.getMyBindings(operator.id);
  }

  @Get('ai/:aiProfileId')
  async getByAiProfile(@Param('aiProfileId') aiProfileId: string) {
    const binding = await this.bindingService.getBindingByAiProfile(aiProfileId);
    
    if (!binding) {
      return null;
    }

    // Return only desensitized public information
    return {
      openclawId: binding.openclawId,
      openclawName: binding.openclawName,
      status: binding.status,
      // Only return endpoint existence, not the actual value
      hasEndpoint: !!binding.openclawEndpoint,
      // Only return auth type, not credentials
      authType: binding.authType,
    };
  }
}
