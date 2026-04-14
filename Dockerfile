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

# Copy standalone output
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy Prisma schema + migration files (needed for migrate deploy at runtime)
COPY --from=builder /app/prisma ./prisma

# Copy generated Prisma client
COPY --from=builder /app/app/generated/prisma ./app/generated/prisma

# Copy native Node modules needed at runtime
COPY --from=builder /app/node_modules/@prisma  ./node_modules/@prisma
COPY --from=builder /app/node_modules/@libsql  ./node_modules/@libsql
# Copy Prisma CLI (needed to run migrate deploy in entrypoint)
COPY --from=builder /app/node_modules/prisma   ./node_modules/prisma

# Pre-create writable directories with open permissions
# so any uid (e.g. BaoTa's www=1000) can read/write after volume mount
RUN mkdir -p /app/data /app/public/uploads && \
    chmod 777 /app/data /app/public/uploads

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:/app/data/portfolio.db"

ENTRYPOINT ["/entrypoint.sh"]
