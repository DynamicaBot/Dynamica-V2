FROM node:21-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build
RUN ls -la /app/dist

FROM scratch as dist
COPY --from=build /app/dist/ .

FROM base as runner
ENV NODE_ENV="production"
ENV DATABASE_URL "file:/app/config/db.sqlite"
ARG VERSION
ENV VERSION=$VERSION
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/dist /app/dist
RUN ls -la /app/dist
CMD [ "pnpm", "start" ]

FROM runner as pterodactyl
ENV DATABASE_URL "file:/home/container/dynamica/db.sqlite"
RUN adduser -H -D container -s /bin/bash
ENV USER=container HOME=/home/container
USER container

CMD [ "/bin/bash", "/app/entrypoint.sh" ]