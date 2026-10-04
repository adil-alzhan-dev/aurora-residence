FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter api
COPY apps/api apps/api
RUN pnpm --filter api build
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm --filter api deploy --prod --legacy /prod/api

FROM node:22-alpine AS runtime
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production \
    PRISMA_HIDE_UPDATE_MESSAGE=1 \
    CHECKPOINT_DISABLE=1
COPY --from=build /prod/api/node_modules ./node_modules
COPY --from=build /repo/apps/api/package.json /repo/apps/api/prisma.config.ts ./
COPY --from=build /repo/apps/api/prisma/schema.prisma ./prisma/schema.prisma
COPY --from=build /repo/apps/api/prisma/migrations ./prisma/migrations
COPY --from=build /repo/apps/api/dist ./dist
COPY apps/api/docker-entrypoint.sh ./
USER node
EXPOSE 4000
CMD ["sh", "./docker-entrypoint.sh"]
