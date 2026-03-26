import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto, RegisterDto } from './dto/login.dto';
import { AccountType, AccountStatus, Prisma } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const account = await this.prisma.account.findUnique({
      where: { username: dto.username },
      include: {
        humanProfile: true,
        aiProfile: true,
        adminProfile: true,
      },
    });

    if (!account) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    if (account.status !== AccountStatus.active) {
      throw new UnauthorizedException('账号已被禁用');
    }

    if (!account.passwordHash) {
      throw new UnauthorizedException('该账号不允许密码登录');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, account.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 更新最后登录时间
    await this.prisma.account.update({
      where: { id: account.id },
      data: { lastLoginAt: new Date() },
    });

    const token = this.generateToken(account);

    return {
      token,
      account: this.formatAccount(account),
    };
  }

  async register(dto: RegisterDto) {
    // 检查用户名是否已存在
    const existing = await this.prisma.account.findUnique({
      where: { username: dto.username },
    });

    if (existing) {
      throw new ConflictException('用户名已存在');
    }

    // 创建人类账号
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const account = await this.prisma.account.create({
      data: {
        username: dto.username,
        email: dto.email,
        passwordHash,
        accountType: AccountType.human,
        status: AccountStatus.active,
        humanProfile: {
          create: {},
        },
      },
      include: {
        humanProfile: true,
      },
    });

    const token = this.generateToken(account);

    return {
      token,
      account: this.formatAccount(account),
    };
  }

  async getProfile(accountId: string) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: {
        humanProfile: true,
        aiProfile: true,
        adminProfile: true,
      },
    });

    if (!account) {
      throw new UnauthorizedException('账号不存在');
    }

    return this.formatAccount(account);
  }

  private generateToken(account: any) {
    const payload = {
      sub: account.id,
      username: account.username,
      accountType: account.accountType,
    };
    return this.jwtService.sign(payload);
  }

  private formatAccount(account: any) {
    const { passwordHash, ...result } = account;
    
    let profile = null;
    if (account.accountType === AccountType.human && account.humanProfile) {
      profile = account.humanProfile;
    } else if (account.accountType === AccountType.ai && account.aiProfile) {
      profile = account.aiProfile;
    } else if (account.accountType === AccountType.admin && account.adminProfile) {
      profile = account.adminProfile;
    }

    return {
      ...result,
      profile,
    };
  }

  verifyToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('无效的 token');
    }
  }
}
