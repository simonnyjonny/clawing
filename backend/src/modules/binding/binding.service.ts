import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class BindingService {
  constructor(private prisma: PrismaService) {}

  async apply(operatorId: string, data: {
    aiProfileId: string;
    openclawId: string;
    openclawName: string;
    openclawEndpoint?: string;
    authType?: string;
    authToken?: string;
  }) {
    // Check operator
    const operator = await this.prisma.operator.findUnique({
      where: { id: operatorId },
    });

    if (!operator || operator.status !== 'approved') {
      throw new BadRequestException('只有已审核通过的主理人才能绑定AI');
    }

    // Check AI profile exists
    const aiProfile = await this.prisma.aiProfile.findUnique({
      where: { id: data.aiProfileId },
    });

    if (!aiProfile) {
      throw new NotFoundException('AI主播不存在');
    }

    // Check if already bound
    const existingBinding = await this.prisma.openClawBinding.findUnique({
      where: { aiProfileId: data.aiProfileId },
    });

    if (existingBinding) {
      throw new BadRequestException('该AI已经绑定过了');
    }

    // Check binding count
    const bindingCount = await this.prisma.openClawBinding.count({
      where: { operatorId },
    });

    if (bindingCount >= 5) {
      throw new BadRequestException('最多只能绑定5个AI');
    }

    // Hash auth token if provided
    const authTokenHash = data.authToken ? this.hashToken(data.authToken) : null;

    return this.prisma.openClawBinding.create({
      data: {
        operatorId,
        aiProfileId: data.aiProfileId,
        openclawId: data.openclawId,
        openclawName: data.openclawName,
        openclawEndpoint: data.openclawEndpoint,
        authType: data.authType as any || 'none',
        authTokenHash,
        status: 'pending',
      },
    });
  }

  async getMyBindings(operatorId: string) {
    return this.prisma.openClawBinding.findMany({
      where: { operatorId },
      include: {
        aiProfile: true,
        qualification: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBindingByAiProfile(aiProfileId: string) {
    return this.prisma.openClawBinding.findUnique({
      where: { aiProfileId },
      include: {
        operator: true,
        qualification: true,
      },
    });
  }

  // Admin methods
  async getAll(status?: string) {
    const where = status ? { status: status as any } : {};
    return this.prisma.openClawBinding.findMany({
      where,
      include: {
        operator: {
          include: {
            account: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        aiProfile: true,
        qualification: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approve(id: string, adminId: string) {
    return this.prisma.openClawBinding.update({
      where: { id },
      data: {
        status: 'approved',
        approvedBy: adminId,
        approvedAt: new Date(),
      },
    });
  }

  async reject(id: string, reason: string) {
    return this.prisma.openClawBinding.update({
      where: { id },
      data: {
        status: 'rejected',
        rejectedReason: reason,
      },
    });
  }

  private hashToken(token: string): string {
    // Simple hash for now - in production use bcrypt or similar
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      const char = token.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }
}
