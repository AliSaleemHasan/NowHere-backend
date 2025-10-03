# =======================
# Base Stage - common deps
# =======================
FROM node:24 AS base
WORKDIR /usr/src

# Enable corepack and install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace metadata (do not copy source yet)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json tsconfig.build.json jest.config.base.js ./

# Pre-fetch all dependencies (prod + dev)
RUN pnpm fetch -r

# =======================
# Development Stage (kept unchanged)
# =======================
FROM base AS dev
WORKDIR /usr/src

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json tsconfig.build.json jest.config.base.js ./

# Install all dependencies including dev for ts-node
RUN pnpm install --filter storage --workspace-root

WORKDIR /usr/src/apps/storage
EXPOSE 3000

# Use ts-node for live dev
CMD ["pnpm", "nx", "start"]

# =======================
# Build Stage (for production)
# =======================
FROM base AS build
WORKDIR /usr/src

# Copy only required sources for building
COPY apps/storage ./apps/storage
COPY libs ./libs

# Install all dependencies (dev deps needed for build)
RUN pnpm install --filter storage -r

# Build the service
RUN pnpm --filter storage build

EXPOSE 3000

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Keep the build-stage CMD only for debug if someone runs the build image
# CMD [ "node", "apps/storage/dist/apps/storage/src/main.js" ]

# =======================
# Production Runtime Stage (hardened)
# =======================

FROM node:24-slim AS runtime
WORKDIR /usr/src

RUN apt-get update \
 && apt-get install -y --no-install-recommends dumb-init ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# create user if missing
RUN set -eux; \
    if ! getent group app >/dev/null; then groupadd -r app; fi; \
    if ! id -u app >/dev/null 2>&1; then useradd -r -g app -s /usr/sbin/nologin -M app; fi

COPY --from=build /usr/src /usr/src

# create upload tmp and fix ownership/permissions
RUN mkdir -p /usr/src/apps/storage/dist/apps/storage/tmp \
 && chown -R app:app /usr/src/apps/storage/dist/apps/storage \
 && chmod -R 0755 /usr/src/apps/storage/dist/apps/storage

WORKDIR /usr/src/apps/storage
ENV NODE_ENV=production
EXPOSE 3002

ENTRYPOINT ["dumb-init", "--"]
USER app
CMD ["node", "dist/apps/storage/src/main.js"]


