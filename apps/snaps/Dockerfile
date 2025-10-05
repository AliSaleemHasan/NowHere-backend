# =======================
# Base Stage - common deps
# =======================
FROM node:24 AS base
WORKDIR /usr/src

# Enable corepack and install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate




# Copy workspace metadata (do not copy source yet)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json tsconfig.build.json jest.config.base.js nx.json  ./


RUN apt-get update \
 && apt-get install -y --no-install-recommends protobuf-compiler \
 && rm -rf /var/lib/apt/lists/*


# Pre-fetch all dependencies (prod + dev)
RUN pnpm fetch -r

# =======================
# Development Stage (kept unchanged)
# =======================
FROM base AS dev
WORKDIR /usr/src

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json tsconfig.build.json jest.config.base.js nx.json  ./

# Install all dependencies including dev for ts-node
RUN pnpm install --filter snaps -r --workspace-root


WORKDIR /usr/src/apps/snaps
EXPOSE 3000

# Use ts-node for live dev
CMD ["pnpm", "nx", "start"]

# =======================
# Build Stage (for production)
# =======================
FROM base AS build


WORKDIR /usr/src

# Copy only required sources for building
COPY apps/snaps ./apps/snaps
COPY libs ./libs

# Install all dependencies (dev deps needed for build)
RUN pnpm install --filter snaps...

RUN ls node_modules
RUN ls apps/snaps/node_modules

# Build the service
RUN pnpm nx build snaps

EXPOSE 3000

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Keep the build-stage CMD only for debug if someone runs the build image
# CMD ["node", "dist/apps/snaps/src/main.js"]

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
EXPOSE 3000

CMD ["dumb-init","node", "apps/snaps/dist/apps/snaps/src/main.js"]
