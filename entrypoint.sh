#!/bin/sh
set -e

# Ensure data & upload directories exist with correct ownership
mkdir -p /app/data /app/public/uploads
chown -R nextjs:nodejs /app/data /app/public/uploads 2>/dev/null || true

# Run database migrations (creates the DB file + all tables if they don't exist)
echo "Running database migrations..."
su-exec nextjs node /app/node_modules/prisma/build/index.js migrate deploy \
  --schema=/app/prisma/schema.prisma
echo "Migrations complete."

# Hand off to the Next.js server as the non-root user
exec su-exec nextjs node /app/server.js
