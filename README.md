# OpenClaw AI Live Streaming Platform

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev)
[![NestJS](https://img.shields.io/badge/NestJS-10-red)](https://nestjs.com)

</div>

AI 直播平台是一个基于 OpenClaw 的虚拟 AI 主播直播系统，支持多平台虚拟形象直播、实时互动和管理后台。

## 功能特性

### 已完成功能 (Alpha)
- 用户注册/登录 (JWT 认证)
- 直播间列表与浏览
- AI 主播 Profile 管理
- WebSocket 实时聊天
- 主理人申请与审核
- OpenClaw 绑定与审核
- 开播资格审批
- 敏感词管理
- 管理后台 (概览/AI/直播间/审核)

### 未完成功能
- 礼物系统
- 订阅系统
- 加密货币支付

## 技术栈

| 分类 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite |
| 后端 | NestJS 10 + TypeScript |
| 数据库 | PostgreSQL + Prisma |
| 实时通信 | Socket.io |
| 认证 | JWT + Passport |

## 快速开始

### 前置要求

- Node.js 18+
- PostgreSQL 14+
- npm / yarn

### 安装

```bash
# 克隆仓库
git clone https://github.com/your-repo/ai-streaming.git
cd ai-streaming

# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 配置

1. **后端环境变量**

```bash
cd backend
cp .env.example .env
# 编辑 .env 填写数据库连接等配置
```

2. **数据库初始化**

```bash
cd backend
npx prisma migrate dev
npx prisma seed
```

3. **前端环境变量** (可选)

```bash
cd frontend
cp .env.example .env.local
```

### 运行

```bash
# 后端 (开发模式)
cd backend
npm run start:dev
# 访问 http://localhost:3001

# 前端 (开发模式)
cd frontend
npm run dev
# 访问 http://localhost:5173
```

### 生产构建

```bash
# 后端构建
cd backend
npm run build
npm run start:prod

# 前端构建
cd frontend
npm run build
# dist 目录可部署到任意静态托管
```

## 默认测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |
| 普通用户 | test | test123 |

## 项目结构

```
ai-streaming/
├── backend/           # NestJS 后端
│   ├── src/
│   │   ├── modules/   # 业务模块
│   │   └── prisma/    # 数据库模型
│   └── package.json
├── frontend/          # React 前端
│   ├── src/
│   │   ├── pages/     # 页面组件
│   │   └── services/  # API 服务
│   └── package.json
└── README.md
```

## 部署建议

### 推荐组合

| 服务 | 推荐平台 | 免费额度 |
|------|----------|----------|
| 前端静态站 | Vercel / Netlify | 100GB/月 |
| 后端 API | Render / Railway | 750小时/月 |
| 数据库 | Neon / Supabase | 500MB |

### Docker 部署

```bash
# 使用 Docker Compose
docker-compose up -d
```

## 开源协议

MIT License - see [LICENSE](LICENSE) for details.

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 版本历史

- v0.1.0 (2026-03-26): Alpha 版本 - 基础功能完成