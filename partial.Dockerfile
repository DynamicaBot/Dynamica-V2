# Deps
FROM node:20-alpine as base
WORKDIR /app
RUN apk update --no-cache
RUN apk add --no-cache python3 make gcc g++ bash curl
COPY package.json yarn.lock tsconfig.json tsup.config.ts prisma ./

# Runner
FROM base as runner
WORKDIR /app

ENV NODE_ENV="production"
ENV DATABASE_URL "file:/app/config/db.sqlite"
ARG VERSION
ENV VERSION=$VERSION
COPY ./node_modules/.prisma /app/node_modules/.prisma
COPY ./dist dist
RUN yarn install --production --frozen-lockfile
CMD npx prisma migrate deploy && yarn start

# Runner
FROM build as pterodactyl

ENV NODE_ENV="production"
ENV DATABASE_URL "file:/home/container/dynamica/db.sqlite"
ARG VERSION
ENV VERSION=$VERSION
WORKDIR /app
RUN yarn install --production --frozen-lockfile
COPY ./node_modules/.prisma /app/node_modules/.prisma
COPY ./dist dist
RUN adduser -H -D container -s /bin/bash
ENV  USER=container HOME=/home/container
USER container

COPY entrypoint.sh /entrypoint.sh

CMD [ "/bin/bash", "/entrypoint.sh" ]