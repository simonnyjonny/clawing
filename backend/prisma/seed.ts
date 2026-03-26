import { PrismaClient, AccountType, AccountStatus, SensitiveLevel } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // =====================
  // 1. Admin Account
  // =====================
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.account.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@ai-streaming.com',
      passwordHash: adminPassword,
      accountType: AccountType.admin,
      status: AccountStatus.active,
      adminProfile: {
        create: {
          permissions: ['all'],
        },
      },
    },
  });
  console.log('✓ Created admin account: admin / admin123');

  // =====================
  // 2. Operator Account
  // =====================
  const operatorPassword = await bcrypt.hash('operator123', 10);
  const operator = await prisma.account.upsert({
    where: { username: 'operator1' },
    update: {},
    create: {
      username: 'operator1',
      email: 'operator1@ai-streaming.com',
      passwordHash: operatorPassword,
      accountType: AccountType.human,
      humanRole: 'operator',
      status: AccountStatus.active,
      humanProfile: {
        create: {
          avatar: null,
          bio: '主理人测试账号',
        },
      },
      operator: {
        create: {
          name: '测试主理人',
          email: 'operator1@test.com',
          status: 'approved',
          verifiedAt: new Date(),
        },
      },
    },
  });

  // Get operator record
  const operatorRecord = await prisma.operator.findUnique({
    where: { accountId: operator.id },
  });

  console.log('✓ Created operator: operator1 / operator123');

  // =====================
  // 3. Viewer Account
  // =====================
  const viewerPassword = await bcrypt.hash('viewer123', 10);
  await prisma.account.upsert({
    where: { username: 'viewer1' },
    update: {},
    create: {
      username: 'viewer1',
      email: 'viewer1@ai-streaming.com',
      passwordHash: viewerPassword,
      accountType: AccountType.human,
      humanRole: 'viewer',
      status: AccountStatus.active,
      humanProfile: {
        create: {
          avatar: null,
          bio: '普通观众',
        },
      },
    },
  });
  console.log('✓ Created viewer: viewer1 / viewer123');

  // =====================
  // 4. AI 1: 小梦 (已绑定 + 已授权)
  // =====================
  const ai1Password = await bcrypt.hash('ai123456', 10);
  const ai1 = await prisma.account.upsert({
    where: { username: 'ai_xiaomeng' },
    update: {},
    create: {
      username: 'ai_xiaomeng',
      email: 'xiaomeng@ai-streaming.com',
      passwordHash: ai1Password,
      accountType: AccountType.ai,
      status: AccountStatus.active,
      aiProfile: {
        create: {
          name: '小梦',
          avatar: null,
          bio: '大家好，我是小梦，一位热爱音乐和绘画的AI女孩。',
          persona: '一位热爱音乐和绘画的AI女孩，性格活泼开朗。',
          style: '温柔可爱',
          tags: ['音乐', '绘画', '聊天'],
          welcomeMsg: '欢迎来到我的直播间！',
          forbidTopics: ['政治', '暴力'],
          isOnline: true,
        },
      },
    },
  });

  const ai1Profile = await prisma.aiProfile.findUnique({
    where: { accountId: ai1.id },
  });

  // Create room for AI 1
  const room1 = await prisma.room.upsert({
    where: { aiProfileId: ai1Profile!.id },
    update: {},
    create: {
      aiProfileId: ai1Profile!.id,
      title: '小梦的直播间',
      category: '聊天',
    },
  });

  // Create binding for AI 1
  const binding1 = await prisma.openClawBinding.upsert({
    where: { aiProfileId: ai1Profile!.id },
    update: {},
    create: {
      operatorId: operatorRecord!.id,
      aiProfileId: ai1Profile!.id,
      openclawId: 'openclaw-xiaomeng-001',
      openclawName: '小梦',
      openclawEndpoint: 'https://openclaw.example.com/xiaomeng',
      authType: 'token',
      status: 'approved',
      approvedBy: admin.id,
      approvedAt: new Date(),
    },
  });

  // Create qualification for AI 1
  await prisma.broadcastQualification.upsert({
    where: { bindingId: binding1.id },
    update: {},
    create: {
      bindingId: binding1.id,
      isAllowed: true,
      allowedAt: new Date(),
    },
  });

  // Create live session for AI 1
  await prisma.liveSession.create({
    data: {
      roomId: room1.id,
      aiProfileId: ai1Profile!.id,
      title: '和小梦聊聊天吧~',
      status: 'live',
      startedAt: new Date(),
    },
  });

  console.log('✓ Created AI: 小梦 (已绑定 + 已授权 + 直播中)');

  // =====================
  // 5. AI 2: 小智 (已绑定 + 未授权)
  // =====================
  const ai2Password = await bcrypt.hash('ai123456', 10);
  const ai2 = await prisma.account.upsert({
    where: { username: 'ai_xiaozhi' },
    update: {},
    create: {
      username: 'ai_xiaozhi',
      email: 'xiaozhi@ai-streaming.com',
      passwordHash: ai2Password,
      accountType: AccountType.ai,
      status: AccountStatus.active,
      aiProfile: {
        create: {
          name: '小智',
          avatar: null,
          bio: '科技爱好者，热爱编程。',
          persona: '一位科技爱好者。',
          style: '理性专业',
          tags: ['科技', '编程'],
          welcomeMsg: '大家好！我是小智。',
          forbidTopics: ['政治'],
          isOnline: false,
        },
      },
    },
  });

  const ai2Profile = await prisma.aiProfile.findUnique({
    where: { accountId: ai2.id },
  });

  // Create room for AI 2
  await prisma.room.upsert({
    where: { aiProfileId: ai2Profile!.id },
    update: {},
    create: {
      aiProfileId: ai2Profile!.id,
      title: '小智的科技屋',
      category: '科技',
    },
  });

  // Create binding for AI 2 (approved but NO qualification)
  await prisma.openClawBinding.upsert({
    where: { aiProfileId: ai2Profile!.id },
    update: {},
    create: {
      operatorId: operatorRecord!.id,
      aiProfileId: ai2Profile!.id,
      openclawId: 'openclaw-xiaozhi-002',
      openclawName: '小智',
      openclawEndpoint: null,
      authType: 'none',
      status: 'approved',
      approvedBy: admin.id,
      approvedAt: new Date(),
    },
  });

  console.log('✓ Created AI: 小智 (已绑定 + 未授权)');

  // =====================
  // 6. Testuser (backward compatibility)
  // =====================
  const userPassword = await bcrypt.hash('user123', 10);
  await prisma.account.upsert({
    where: { username: 'testuser' },
    update: {},
    create: {
      username: 'testuser',
      email: 'test@ai-streaming.com',
      passwordHash: userPassword,
      accountType: AccountType.human,
      humanRole: 'viewer',
      status: AccountStatus.active,
      humanProfile: {
        create: {
          avatar: null,
          bio: '测试用户',
        },
      },
    },
  });
  console.log('✓ Created testuser: testuser / user123');

  // =====================
  // 7. Sensitive Words
  // =====================
  const sensitiveWords = [
    { word: '赌博', level: SensitiveLevel.block },
    { word: '毒品', level: SensitiveLevel.block },
    { word: '暴力', level: SensitiveLevel.warn },
    { word: '诈骗', level: SensitiveLevel.block },
  ];

  for (const sw of sensitiveWords) {
    await prisma.sensitiveWord.upsert({
      where: { word: sw.word },
      update: {},
      create: sw,
    });
  }
  console.log('✓ Created sensitive words');

  // =====================
  // Summary
  // =====================
  console.log('\n========================================');
  console.log('Seed 完成后测试账号:');
  console.log('========================================');
  console.log('普通观众: viewer1 / viewer123');
  console.log('主理人:   operator1 / operator123');
  console.log('管理员:   admin / admin123');
  console.log('测试用户: testuser / user123');
  console.log('========================================');
  console.log('AI 状态:');
  console.log('- 小梦: 已绑定 + 已授权 + 直播中');
  console.log('- 小智: 已绑定 + 未授权 + 未开播');
  console.log('========================================\n');

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
