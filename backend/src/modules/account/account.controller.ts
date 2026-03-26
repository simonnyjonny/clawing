import { Controller, Get, Param, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('accounts')
export class AccountController {
  constructor(private prisma: PrismaService) {}

  @Get(':id')
  async getAccount(@Param('id') id: string) {
    const account = await this.prisma.account.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        accountType: true,
        humanProfile: true,
        aiProfile: true,
      },
    });
    return account;
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('me')
  async updateProfile(@Request() req: any, @Body() data: { avatar?: string; bio?: string }) {
    const account = await this.prisma.account.findUnique({
      where: { id: req.user.sub },
    });

    if (!account || account.accountType !== 'human') {
      throw new Error('Invalid account');
    }

    return this.prisma.humanProfile.update({
      where: { accountId: req.user.sub },
      data,
    });
  }
}
