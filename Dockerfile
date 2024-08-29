# Base
FROM node:21-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app

# Prod Dependencies
FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

# Build
FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build

# Build Artifacts
FROM scratch AS extract
COPY --from=build /app/dist /dist

# Pterodactyl Image
FROM base as pterodactyl
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/dist /app/dist

ENV NODE_ENV="production"
ENV DATABASE_URL "file:/home/container/dynamica/db.sqlite"
ARG VERSION
ENV VERSION=$VERSION

RUN adduser -H -D container -s /bin/bash
ENV  USER=container HOME=/home/container
USER container

HEALTHCHECK CMD curl --fail http://localhost:3000 || exit 1

COPY entrypoint.sh /entrypoint.sh

CMD [ "/bin/bash", "/entrypoint.sh" ]

# Default Image
FROM base
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/dist /app/dist

ENV NODE_ENV="production"
ENV DATABASE_URL "file:/app/config/db.sqlite"
ARG VERSION
ENV VERSION=$VERSION

HEALTHCHECK CMD curl --fail http://localhost:3000 || exit 1

CMD [ "pnpm", "start" ]
