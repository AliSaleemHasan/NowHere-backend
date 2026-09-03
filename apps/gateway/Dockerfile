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

COPY apps/gateway ./apps/gateway
COPY libs ./libs

RUN pnpm install --filter gateway...

WORKDIR /usr/src/apps/gateway
EXPOSE 3005
CMD ["pnpm", "nx", "start"]

# =======================
# Build Stage
# =======================
FROM base AS build
WORKDIR /usr/src

COPY apps/gateway ./apps/gateway
COPY libs ./libs

RUN pnpm install --filter gateway...
RUN pnpm nx build gateway

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
COPY --from=build --chown=node:node /usr/src/apps/gateway/package.json ./apps/gateway/package.json
COPY --from=build --chown=node:node /usr/src/apps/gateway/node_modules ./apps/gateway/node_modules

ENV NODE_ENV=production
USER node
EXPOSE 3005
CMD ["dumb-init", "node", "dist/apps/gateway/apps/gateway/src/main.js"]
