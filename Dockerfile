# syntax=docker/dockerfile:1.7
#
# Multi-stage build for the `human-language` microservice.
#
# Stage 1 ("deps") installs production npm dependencies into a fresh layer
# so the resulting image only contains what the runtime needs.
#
# Stage 2 ("runtime") starts from a minimal node base image, drops to a
# non-root user, and runs `human-language serve`. Configuration is read
# from environment variables (HUMAN_LANGUAGE_*) — see js/src/config.js.
#
# Build:
#   docker build -t human-language:dev .
# Run:
#   docker run --rm -p 8080:8080 human-language:dev

ARG NODE_VERSION=22.11.0

FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# `npm ci --omit=dev` will fail if no lockfile exists, so prefer install.
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

FROM node:${NODE_VERSION}-alpine AS runtime
WORKDIR /app

# Drop privileges. The `node:alpine` image already ships a `node` user.
USER node

# Copy only the runtime surface: production deps, source, and metadata.
COPY --chown=node:node --from=deps /app/node_modules ./node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node js ./js

ENV NODE_ENV=production \
    HUMAN_LANGUAGE_HOST=0.0.0.0 \
    HUMAN_LANGUAGE_PORT=8080 \
    HUMAN_LANGUAGE_CACHE_TYPE=file \
    HUMAN_LANGUAGE_CACHE_DIR=/app/data/wikidata-cache

EXPOSE 8080

# A small inline healthcheck so orchestrators can see the server is live
# without depending on `curl` being in the image. We use Node's built-in
# fetch so no extra binaries are needed.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.HUMAN_LANGUAGE_PORT||8080)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["node", "js/src/cli.js"]
CMD ["serve"]
