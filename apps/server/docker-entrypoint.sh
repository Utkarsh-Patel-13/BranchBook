#!/bin/sh
set -e

echo "Generating Prisma client..."
cd /app/packages/db && bunx prisma generate

echo "Applying database migrations..."
cd /app/packages/db && bunx prisma migrate deploy

echo "Starting server..."
exec bun /app/apps/server/dist/index.mjs
