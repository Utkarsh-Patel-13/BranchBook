#!/bin/sh
set -e

echo "Applying database migrations..."
cd /app/packages/db && bunx prisma migrate deploy

echo "Starting server..."
exec bun /app/apps/server/dist/index.mjs
