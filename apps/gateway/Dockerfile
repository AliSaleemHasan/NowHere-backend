# =======================
# Base Stage - common deps
# =======================
FROM node:24 AS base
WORKDIR /usr/src

# Enable corepack and install pnpm
RUN corepack enable && corepack prepare pnpm@10.15.1 --activate




# Copy workspace metadata (do not copy source yet)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json tsconfig.build.json jest.config.base.js nx.json .npmrc ./


RUN apt-get update \
 && apt-get install -y --no-install-recommends protobuf-compiler \
 && rm -rf /var/lib/apt/lists/*


# Pre-fetch all dependencies (prod + dev)
RUN pnpm fetch -r

# =======================
# Development Stage
# =======================
FROM base AS dev
WORKDIR /usr/src

COPY apps/gateway ./apps/gateway
COPY libs ./libs

# Install all dependencies including dev for ts-node
RUN pnpm install --filter gateway...

WORKDIR /usr/src/apps/gateway
EXPOSE 3005

# Use ts-node for live dev
CMD ["pnpm", "nx", "start"]

# =======================
# Build Stage (for production)
# =======================
FROM base AS build


WORKDIR /usr/src

# Copy only required sources for building
COPY apps/gateway ./apps/gateway
COPY libs ./libs

# Install all dependencies (dev deps needed for build)
RUN pnpm install --filter gateway...

RUN ls node_modules
RUN ls apps/gateway/node_modules

# Build the service
RUN pnpm nx build gateway

EXPOSE 3005

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Keep the build-stage CMD only for debug if someone runs the build image
# CMD ["node", "dist/apps/gateway/src/main.js"]

# =======================
# Production Runtime Stage (hardened with pnpm)
# =======================
FROM node:24-slim AS runtime
WORKDIR /usr/src

RUN apt-get update \
 && apt-get install -y --no-install-recommends dumb-init ca-certificates \
 && rm -rf /var/lib/apt/lists/*



COPY --from=build /usr/src /usr/src/


ENV NODE_ENV=production
EXPOSE 3005

CMD ["dumb-init","node", "apps/gateway/dist/apps/gateway/src/main.js"]
