#!/bin/sh
set -e

# Ensure directories exist
mkdir -p /app/data /app/public/uploads

# Run database migrations — creates DB file + all tables if they don't exist
echo "Running database migrations..."
node /app/node_modules/prisma/build/index.js migrate deploy
echo "Migrations complete."

# Seed default admin user if none exists
echo "Checking admin user..."
node /app/scripts/seed-admin.cjs

exec node /app/server.js
