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
# Development Stage
# =======================
FROM base AS dev
WORKDIR /usr/src
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json tsconfig.build.json jest.config.base.js ./


# Copy sources for development
# COPY apps/storage ./apps/storage
# COPY libs ./libs

# Install all dependencies including dev for ts-node
RUN pnpm install --filter storage --workspace-root

WORKDIR /usr/src/apps/storage
EXPOSE 3001

# Use ts-node for live dev
CMD ["pnpm", "nx","start"]

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

# =======================
# Production Runtime Stage
# =======================
FROM node:24-alpine AS runtime
WORKDIR /usr/src

# Install minimal runtime dependencies
RUN apk add --no-cache dumb-init libstdc++

# Set NODE_ENV to production by default
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Copy built JS and only prod dependencies
COPY --from=build /usr/src/dist ./dist
COPY --from=build /usr/src/node_modules ./node_modules

WORKDIR /usr/src/apps/storage
EXPOSE 3002

# Production CMD
CMD ["dumb-init", "node", "dist/main.js"]
