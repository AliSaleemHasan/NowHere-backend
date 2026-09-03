# =======================
# Base Stage - common deps
# =======================
FROM node:24 AS base
WORKDIR /usr/src

RUN corepack enable && corepack prepare pnpm@10.15.1 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json tsconfig.build.json jest.config.base.js nx.json .npmrc ./

RUN pnpm fetch -r

# =======================
# Development Stage
# =======================
FROM base AS dev
WORKDIR /usr/src

COPY apps/storage ./apps/storage
COPY libs ./libs

RUN pnpm install --filter storage...

WORKDIR /usr/src/apps/storage
EXPOSE 3002
CMD ["pnpm", "nx", "start"]

# =======================
# Build Stage
# =======================
FROM base AS build
WORKDIR /usr/src

COPY apps/storage ./apps/storage
COPY libs ./libs

RUN pnpm install --filter storage...
RUN pnpm nx build storage

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# =======================
# Production Runtime
# =======================
FROM node:24-slim AS runtime
WORKDIR /usr/src

RUN apt-get update \
 && apt-get install -y --no-install-recommends dumb-init ca-certificates \
 && rm -rf /var/lib/apt/lists/*

COPY --from=build --chown=node:node /usr/src/package.json /usr/src/pnpm-lock.yaml /usr/src/pnpm-workspace.yaml ./
COPY --from=build --chown=node:node /usr/src/node_modules ./node_modules
COPY --from=build --chown=node:node /usr/src/libs ./libs
COPY --from=build --chown=node:node /usr/src/dist ./dist
COPY --from=build --chown=node:node /usr/src/apps/storage/package.json ./apps/storage/package.json
COPY --from=build --chown=node:node /usr/src/apps/storage/node_modules ./apps/storage/node_modules

ENV NODE_ENV=production
USER node
EXPOSE 3002
CMD ["dumb-init", "node", "dist/apps/storage/apps/storage/src/main.js"]
