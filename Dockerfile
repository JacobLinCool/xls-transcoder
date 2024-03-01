FROM node:lts AS builder

WORKDIR /app

RUN npm i -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install

COPY . .
RUN pnpm wrangler deploy --dry-run --outdir .wrangler/dist

FROM jacoblincool/workerd

COPY --from=builder /app/.wrangler/dist/index.js .wrangler/dist/index.js
COPY --from=builder /app/worker.capnp ./worker.capnp
