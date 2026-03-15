#!/bin/sh
set -e

# When the image is pulled from a registry it was built with the placeholder
# __VITE_SERVER_URL__ so that VITE_SERVER_URL can be supplied at runtime.
# When built locally via docker-compose the real URL is baked in at build time
# and the sed below is a no-op (no placeholder to replace).
# Copy to /tmp so sed can write (container may run with read_only root).
SERVE_DIR=/app/dist
if [ -n "$VITE_SERVER_URL" ]; then
    cp -a /app/dist /tmp/dist
    find /tmp/dist -type f -name "*.js" \
        -exec sed -i "s|__VITE_SERVER_URL__|$VITE_SERVER_URL|g" {} +
    SERVE_DIR=/tmp/dist
fi

exec serve --single -l 3001 "$SERVE_DIR"
