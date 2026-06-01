# ReportPilot

ReportPilot 是一个本地运行的 AI 数据清洗与报表生成系统。MVP 目标是跑通注册、登录、CSV 上传、本地文件存储、MySQL 元数据、worker 解析、DeepSeek 报告生成和报告展示闭环。

## 技术栈

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma
- MySQL 8
- Auth.js
- Papa Parse
- Recharts
- DeepSeek API

## 本地环境

- Node.js 20+
- pnpm
- MySQL 8.x

当前项目不使用 Docker。

## MySQL 8 准备

```sql
CREATE DATABASE reportpilot
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

CREATE USER 'reportpilot_user'@'localhost'
IDENTIFIED BY 'reportpilot_password';

GRANT ALL PRIVILEGES ON reportpilot.* TO 'reportpilot_user'@'localhost';
FLUSH PRIVILEGES;
```

## 环境变量

复制 `.env.example` 为 `.env.local`，并替换真实配置。

```bash
cp .env.example .env.local
```

## 安装依赖

```bash
pnpm install
```

## Prisma

```bash
pnpm db:generate
pnpm db:migrate
```

## 启动 Web

```bash
pnpm dev
```

## 当前阶段

当前处于 Phase 1：地基工程。认证、上传、worker、CSV 解析、DeepSeek 报告和图表将在后续阶段按顺序实现。
