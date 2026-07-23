FROM node:22-alpine AS builder

WORKDIR /app
ENV DATABASE_URL=file:/tmp/build.db

COPY package.json package-lock.json ./
RUN npm ci \
    --fetch-retries=5 \
    --fetch-retry-mintimeout=20000 \
    --fetch-retry-maxtimeout=120000

COPY prisma ./prisma
RUN npm run db:generate

COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src ./src
COPY scripts ./scripts

RUN npm run build \
    && npm prune --omit=dev --ignore-scripts

FROM node:22-alpine AS production

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY prisma ./prisma
COPY scripts ./scripts

RUN mkdir -p /app/data \
    && chown node:node /app/data

USER node

EXPOSE 3001

CMD ["sh", "-c", "node scripts/prisma-with-sqlite.mjs migrate deploy && node prisma/seed.mjs && exec node dist/main.js"]
