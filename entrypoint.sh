#!/bin/sh
set -e

# Ensure directories exist
mkdir -p /app/data /app/public/uploads

# Run database migrations (creates DB file + all tables if they don't exist)
echo "Running database migrations..."
node /app/node_modules/prisma/build/index.js migrate deploy \
  --schema=/app/prisma/schema.prisma
echo "Migrations complete."

exec node /app/server.js
