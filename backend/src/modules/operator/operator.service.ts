import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class OperatorService {
  constructor(private prisma: PrismaService) {}

  async apply(accountId: string, data: { name: string; email: string }) {
    const existing = await this.prisma.operator.findUnique({
      where: { accountId },
    });

    if (existing) {
      if (existing.status === 'approved') {
        throw new BadRequestException('您已经是主理人');
      }
      if (existing.status === 'pending') {
        throw new BadRequestException('您的申请正在审核中');
      }
      // 如果是 rejected，更新并重新申请
      return this.prisma.operator.update({
        where: { accountId },
        data: {
          name: data.name,
          email: data.email,
          status: 'pending',
          verifiedAt: null,
        },
      });
    }

    return this.prisma.operator.create({
      data: {
        accountId,
        name: data.name,
        email: data.email,
        status: 'pending',
      },
    });
  }

  async getMyOperator(accountId: string) {
    const operator = await this.prisma.operator.findUnique({
      where: { accountId },
    });

    if (!operator) {
      return null;
    }

    return operator;
  }

  async updateMyOperator(accountId: string, data: { name?: string; email?: string }) {
    const operator = await this.prisma.operator.findUnique({
      where: { accountId },
    });

    if (!operator) {
      throw new NotFoundException('主理人信息不存在');
    }

    if (operator.status !== 'approved') {
      throw new BadRequestException('只有审核通过后才能修改信息');
    }

    return this.prisma.operator.update({
      where: { accountId },
      data: {
        name: data.name,
        email: data.email,
      },
    });
  }

  // Admin methods
  async getAll(status?: string) {
    const where = status ? { status: status as any } : {};
    return this.prisma.operator.findMany({
      where,
      include: {
        account: {
          select: {
            id: true,
            username: true,
          },
        },
        bindings: {
          include: {
            aiProfile: true,
            qualification: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approve(id: string, adminId: string) {
    return this.prisma.operator.update({
      where: { id },
      data: {
        status: 'approved',
        verifiedAt: new Date(),
      },
    });
  }

  async reject(id: string, reason: string) {
    return this.prisma.operator.update({
      where: { id },
      data: {
        status: 'rejected',
      },
    });
  }
}
