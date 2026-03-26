import { Controller, Get, Post, Patch, Body, Param, Request, UseGuards } from '@nestjs/common';
import { OperatorService } from './operator.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('operators')
export class OperatorController {
  constructor(private readonly operatorService: OperatorService) {}

  @Post('apply')
  @UseGuards(AuthGuard('jwt'))
  async apply(@Request() req: any, @Body() body: { name: string; email: string }) {
    const operator = await this.operatorService.apply(req.user.sub, body);
    return operator;
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getMyOperator(@Request() req: any) {
    const operator = await this.operatorService.getMyOperator(req.user.sub);
    return operator;
  }

  @Patch('me')
  @UseGuards(AuthGuard('jwt'))
  async updateMyOperator(@Request() req: any, @Body() body: { name?: string; email?: string }) {
    const operator = await this.operatorService.updateMyOperator(req.user.sub, body);
    return operator;
  }
}
