# Shared NestJS service image. Build with:
#   docker build -f docker/service.Dockerfile \
#     --build-arg APP_NAME=authentication --build-arg APP_PORT=3004 --target runtime .
ARG APP_NAME=authentication
ARG APP_PORT=3004

FROM node:24 AS base
WORKDIR /usr/src
ARG APP_NAME
ARG APP_PORT

RUN corepack enable && corepack prepare pnpm@10.15.1 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json tsconfig.build.json jest.config.base.js nx.json .npmrc ./

RUN pnpm fetch -r

FROM base AS dev
WORKDIR /usr/src
ARG APP_NAME
ARG APP_PORT

COPY apps/${APP_NAME} ./apps/${APP_NAME}
COPY libs ./libs

RUN pnpm install --filter ${APP_NAME}...

WORKDIR /usr/src/apps/${APP_NAME}
EXPOSE ${APP_PORT}
CMD ["pnpm", "nx", "start"]

FROM base AS build
WORKDIR /usr/src
ARG APP_NAME

COPY apps/${APP_NAME} ./apps/${APP_NAME}
COPY libs ./libs

RUN pnpm install --filter ${APP_NAME}...
RUN pnpm nx build ${APP_NAME}

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

FROM node:24-slim AS runtime
WORKDIR /usr/src
ARG APP_NAME
ARG APP_PORT

RUN apt-get update \
 && apt-get install -y --no-install-recommends dumb-init ca-certificates \
 && rm -rf /var/lib/apt/lists/*

COPY --from=build --chown=node:node /usr/src/package.json /usr/src/pnpm-lock.yaml /usr/src/pnpm-workspace.yaml ./
COPY --from=build --chown=node:node /usr/src/node_modules ./node_modules
COPY --from=build --chown=node:node /usr/src/libs ./libs
COPY --from=build --chown=node:node /usr/src/dist ./dist
COPY --from=build --chown=node:node /usr/src/apps/${APP_NAME}/package.json ./apps/${APP_NAME}/package.json
COPY --from=build --chown=node:node /usr/src/apps/${APP_NAME}/node_modules ./apps/${APP_NAME}/node_modules

ENV NODE_ENV=production
ENV APP_NAME=${APP_NAME}
ENV NODE_PATH=/usr/src/apps/${APP_NAME}/node_modules:/usr/src/node_modules
USER node
EXPOSE ${APP_PORT}
CMD ["sh", "-c", "exec dumb-init node dist/apps/${APP_NAME}/apps/${APP_NAME}/src/main.js"]
