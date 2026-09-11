# syntax=docker/dockerfile:1.7

FROM node:22.18.0-bookworm-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="${PNPM_HOME}:${PATH}"

RUN corepack enable

WORKDIR /workspace


FROM base AS build-dependencies

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages/chat-sidebar/package.json packages/chat-sidebar/package.json
COPY packages/chat-sidebar-server/package.json packages/chat-sidebar-server/package.json

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install \
        --frozen-lockfile \
        --filter chat-sidebar \
        --filter chat-sidebar-server


FROM build-dependencies AS build

COPY packages/chat-sidebar packages/chat-sidebar
COPY packages/chat-sidebar-server packages/chat-sidebar-server

RUN pnpm --filter chat-sidebar build \
    && pnpm --filter chat-sidebar-server build


FROM base AS production-dependencies

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages/chat-sidebar-server/package.json packages/chat-sidebar-server/package.json

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install \
        --frozen-lockfile \
        --prod \
        --filter chat-sidebar-server


FROM node:22.18.0-bookworm-slim AS runtime

ENV NODE_ENV="production"
ENV HOST="0.0.0.0"
ENV PORT="4000"

WORKDIR /app

COPY --from=production-dependencies /workspace/node_modules ./node_modules
COPY --from=production-dependencies /workspace/packages/chat-sidebar-server/node_modules ./packages/chat-sidebar-server/node_modules
COPY --from=production-dependencies /workspace/packages/chat-sidebar-server/package.json ./packages/chat-sidebar-server/package.json
COPY --from=build /workspace/packages/chat-sidebar-server/dist ./packages/chat-sidebar-server/dist
COPY --from=build /workspace/packages/chat-sidebar/dist ./packages/chat-sidebar-server/public

USER node

EXPOSE 4000

CMD ["node", "packages/chat-sidebar-server/dist/server.js"]
