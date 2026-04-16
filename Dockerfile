# ── Stage 1: deps ──────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ── Stage 2: builder ───────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client (outputs to app/generated/prisma per schema.prisma)
RUN npx prisma generate

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── Stage 3: runner ────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Next.js standalone 已自带精简的运行时依赖（~49MB），无需拷完整 node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Prisma schema + migrations（migrate deploy 需要读取）
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# 生成好的 Prisma client（运行时查询用）
COPY --from=builder /app/app/generated/prisma ./app/generated/prisma

# 只安装 entrypoint 启动脚本需要的最小依赖：
#   prisma  — migrate deploy
#   bcryptjs — seed-admin.cjs 密码哈希
# @libsql/client 已由 standalone 自带，无需重复安装
RUN npm install --no-save prisma@7 bcryptjs@3 \
    && npm cache clean --force

# 预建写入目录
RUN mkdir -p /app/data /app/public/uploads && \
    chmod 777 /app/data /app/public/uploads

# 启动脚本
COPY scripts/seed-admin.cjs /app/scripts/seed-admin.cjs
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:/app/data/portfolio.db"

ENTRYPOINT ["/entrypoint.sh"]
