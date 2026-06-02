# ReportPilot

ReportPilot 是一个本地运行的 AI 数据清洗与报表生成系统。当前 MVP 已跑通：

```txt
注册 / 登录
→ 自动创建 workspace
→ 上传 CSV
→ 本地保存文件
→ MySQL 写入 FileAsset 和 ImportJob
→ 本地 worker 解析 CSV
→ 生成字段画像和数据质量检查
→ 调用 DeepSeek
→ 校验 JSON
→ 保存 Report
→ 前端展示报告和历史记录
```

本项目只面向本地开发环境，不使用 Docker。

## 技术栈

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma
- MySQL 8
- Auth.js / NextAuth
- Papa Parse
- Recharts
- DeepSeek API
- Vitest

## 目录结构

```txt
prisma/                         Prisma schema 和 migration
samples/                        测试 CSV 样本
src/app/                        Next.js App Router 页面和 API
src/app/(app)/                  登录后的产品页面
src/lib/                        认证、权限、CSV、AI、存储、用量等公共逻辑
src/workers/                    本地 import worker
.local-storage/uploads/         本地上传文件目录，已被 .gitignore 忽略
```

## 环境要求

- Node.js 20+
- pnpm
- MySQL 8.x
- DeepSeek API Key

## 本地 MySQL 8 准备

推荐创建独立数据库和用户：

```sql
CREATE DATABASE reportpilot
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

CREATE USER 'reportpilot_user'@'localhost'
IDENTIFIED BY 'reportpilot_password';

GRANT ALL PRIVILEGES ON reportpilot.* TO 'reportpilot_user'@'localhost';
FLUSH PRIVILEGES;
```

如果本机 MySQL 账号和密码都是 `root`，也可以直接在 `.env.local` 中把 `DATABASE_URL` 改为对应账号。

## 环境变量

复制 `.env.example` 为 `.env.local`：

```bash
cp .env.example .env.local
```

Windows PowerShell 可执行：

```powershell
Copy-Item .env.example .env.local
```

至少需要配置：

```env
DATABASE_URL="mysql://reportpilot_user:reportpilot_password@127.0.0.1:3306/reportpilot"
AUTH_SECRET="请替换为随机字符串"
NEXTAUTH_URL="http://localhost:3000"
DEEPSEEK_API_KEY="请替换为真实 DeepSeek API Key"
DEEPSEEK_BASE_URL="https://api.deepseek.com"
DEEPSEEK_MODEL_FAST="deepseek-v4-flash"
DEEPSEEK_MODEL_PRO="deepseek-v4-pro"
```

注意：不要提交 `.env.local`。DeepSeek API Key 只在服务端读取，不会暴露给前端。

## 安装依赖

```bash
pnpm install
```

## 初始化数据库

```bash
pnpm db:generate
pnpm db:migrate
```

## 启动 Web

终端 1：

```bash
pnpm dev
```

默认访问：

```txt
http://localhost:3000
```

## 启动 Worker

终端 2：

```bash
pnpm worker:imports
```

worker 会轮询 MySQL `import_jobs` 表，处理 `PENDING` 任务。

## 验证 MVP 流程

1. 打开 `http://localhost:3000`。
2. 注册新用户。
3. 登录后进入 Dashboard。
4. 进入「文件」或「上传 CSV」页面。
5. 上传 `samples/demo-sales.csv`。
6. 保持 `pnpm worker:imports` 运行。
7. 等待文件状态从「解析中」变为「已解析」。
8. 打开报告列表，查看生成的 AI 报告。
9. 进入报告详情，检查摘要、质量评分、洞察、推荐图表、字段画像和下一步建议。

## 测试 CSV 样本

项目内置样本：

```txt
samples/demo-sales.csv
```

说明见：

```txt
测试样本说明.md
```

## 常用命令

```bash
pnpm test          # 运行单元测试
pnpm typecheck     # TypeScript 类型检查
pnpm lint          # ESLint 检查
pnpm build         # 生产构建
pnpm db:validate   # Prisma schema 校验
pnpm db:studio     # 打开 Prisma Studio
```

## API 返回格式

成功：

```json
{
  "ok": true,
  "data": {}
}
```

失败：

```json
{
  "ok": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "文件不能超过 10 MB"
  }
}
```

## 安全约束

- 密码使用 bcrypt 哈希存储。
- 上传文件保存到 `.local-storage/uploads`，不放入 `public`。
- 文件、任务、报告查询必须校验 workspace 权限。
- 不把完整 CSV 发送给 DeepSeek。
- DeepSeek 只接收字段画像、质量摘要、少量脱敏样本和基础统计。
- AI 输出必须能 JSON parse，并通过 Zod 校验。
- 不向用户展示 `aiRawJson`、错误堆栈或密钥。

## 常见问题

### Prisma 连接不上 MySQL

检查 `.env.local` 中的 `DATABASE_URL` 是否与本机 MySQL 账号、密码、端口和数据库名一致。MySQL 8 默认端口通常是 `3306`。

### 上传后没有生成报告

确认第二个终端已运行：

```bash
pnpm worker:imports
```

如果 DeepSeek API Key 未配置或余额不足，任务会失败并记录失败原因。

### DeepSeek 返回失败

检查：

- `DEEPSEEK_API_KEY` 是否是真实 Key。
- `DEEPSEEK_BASE_URL` 是否正确。
- 模型名是否可用。
- 账号是否有余额。

`401` / `402` 不会盲目重试，会记录配置或余额问题。

### 上传文件太大或行数太多

MVP 默认限制：

- 单文件最大 10 MB。
- 免费版最多 10 个文件。
- 单文件最多处理 5000 行。

可在 `.env.local` 中调整 `MAX_UPLOAD_SIZE_MB`、`FREE_MAX_FILES` 和 `FREE_MAX_ROWS_PER_FILE`。

## 已知限制

- 仅支持 CSV，不支持 Excel。
- 不支持 Docker。
- 不支持线上部署。
- 不支持 Cloudflare R2 / S3。
- 不支持 Stripe 支付。
- 不支持 Redis / BullMQ。
- 不支持团队邀请、OAuth 登录和 PDF 导出。
- worker 适合本地 MVP，生产环境需要更完整的队列和部署方案。

## 后续扩展路线

- Excel 支持。
- PDF 导出。
- 对象存储。
- 团队 workspace。
- 报告分享。
- API Token。
- 线上部署和监控。
