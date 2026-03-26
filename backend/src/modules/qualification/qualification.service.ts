import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class QualificationService {
  constructor(private prisma: PrismaService) {}

  async apply(operatorId: string, bindingId: string) {
    // Check operator
    const operator = await this.prisma.operator.findUnique({
      where: { id: operatorId },
    });

    if (!operator || operator.status !== 'approved') {
      throw new BadRequestException('只有已审核通过的主理人才能申请开播');
    }

    // Check binding exists and is approved
    const binding = await this.prisma.openClawBinding.findUnique({
      where: { id: bindingId },
    });

    if (!binding) {
      throw new NotFoundException('绑定记录不存在');
    }

    if (binding.status !== 'approved') {
      throw new BadRequestException('绑定审核通过后才能申请开播');
    }

    // Check if qualification already exists
    const existing = await this.prisma.broadcastQualification.findUnique({
      where: { bindingId },
    });

    if (existing) {
      if (existing.isAllowed) {
        throw new BadRequestException('您已经具有开播资格');
      }
      // Update existing
      return this.prisma.broadcastQualification.update({
        where: { id: existing.id },
        data: {
          isAllowed: false,
          revokedAt: null,
          reason: null,
        },
      });
    }

    return this.prisma.broadcastQualification.create({
      data: {
        bindingId,
        isAllowed: false, // Need admin approval
      },
    });
  }

  async getMyQualifications(operatorId: string) {
    const bindings = await this.prisma.openClawBinding.findMany({
      where: { operatorId },
      include: {
        aiProfile: true,
        qualification: true,
      },
    });

    return bindings.map(b => ({
      bindingId: b.id,
      aiProfile: b.aiProfile,
      qualification: b.qualification,
    }));
  }

  async getByBinding(bindingId: string) {
    return this.prisma.broadcastQualification.findUnique({
      where: { bindingId },
    });
  }

  // Admin methods
  async getAll(isAllowed?: boolean) {
    const where = isAllowed !== undefined ? { isAllowed } : {};
    const qualifications = await this.prisma.broadcastQualification.findMany({
      where,
      include: {
        binding: {
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
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return qualifications;
  }

  async approve(bindingId: string) {
    let qualification = await this.prisma.broadcastQualification.findUnique({
      where: { bindingId },
    });

    if (!qualification) {
      qualification = await this.prisma.broadcastQualification.create({
        data: {
          bindingId,
          isAllowed: true,
          allowedAt: new Date(),
        },
      });
    } else {
      qualification = await this.prisma.broadcastQualification.update({
        where: { id: qualification.id },
        data: {
          isAllowed: true,
          allowedAt: new Date(),
          revokedAt: null,
          reason: null,
        },
      });
    }

    return qualification;
  }

  async revoke(bindingId: string, reason: string) {
    const qualification = await this.prisma.broadcastQualification.findUnique({
      where: { bindingId },
    });

    if (!qualification) {
      throw new NotFoundException('开播资格记录不存在');
    }

    return this.prisma.broadcastQualification.update({
      where: { id: qualification.id },
      data: {
        isAllowed: false,
        revokedAt: new Date(),
        reason,
      },
    });
  }
}
