# dynamica-v2

## 3.3.1

### Patch Changes

- [`c3c4bb8`](https://github.com/DynamicaBot/Dynamica-V2/commit/c3c4bb8f47be645a2d9d7ed1a16bc6329901fb65) Thanks [@sebasptsch](https://github.com/sebasptsch)! - Remove @nestjs/config in favour of @t3-oss/env-core

- [#393](https://github.com/DynamicaBot/Dynamica-V2/pull/393) [`d3f3ccf`](https://github.com/DynamicaBot/Dynamica-V2/commit/d3f3ccfa09bea78cb59ef01d7de5acb186123fdc) Thanks [@sebasptsch](https://github.com/sebasptsch)! - Fix issue with bash not existing in the pterodactyl container by switching to sh.

## 3.3.0

### Minor Changes

- [`c6eafe7`](https://github.com/DynamicaBot/Dynamica-V2/commit/c6eafe7f5a342b0af4d51f1a48ab7c2d52d52892) Thanks [@sebasptsch](https://github.com/sebasptsch)! - Suppress channel settings notification

### Patch Changes

- [`700f09b`](https://github.com/DynamicaBot/Dynamica-V2/commit/700f09b3e4a47157247096cfc7fc7d0583749de8) Thanks [@sebasptsch](https://github.com/sebasptsch)! - fix sourcemap location

- [`8d6ec0a`](https://github.com/DynamicaBot/Dynamica-V2/commit/8d6ec0afa1e0919b4dd228e24721a9a9c24cd6a7) Thanks [@sebasptsch](https://github.com/sebasptsch)! - fix 10003 error on rename

## 3.2.0

### Minor Changes

- [#383](https://github.com/DynamicaBot/Dynamica-V2/pull/383) [`74ca397`](https://github.com/DynamicaBot/Dynamica-V2/commit/74ca39758c3f1940417e5cc08bec42d660f08d03) Thanks [@sebasptsch](https://github.com/sebasptsch)! - Pinned Channels

## 3.1.2

### Patch Changes

- [`d161aa5`](https://github.com/DynamicaBot/Dynamica-V2/commit/d161aa5b7f7e5e013a9d4df00bf337d43622845f) Thanks [@sebasptsch](https://github.com/sebasptsch)! - use wget for healthchecks

## 3.1.1

### Patch Changes

- [`168ce8e`](https://github.com/DynamicaBot/Dynamica-V2/commit/168ce8e25d85c66377b1445abad3aa2528803bb3) Thanks [@sebasptsch](https://github.com/sebasptsch)! - Add controller tag

## 3.1.0

### Minor Changes

- [`6ec358d`](https://github.com/DynamicaBot/Dynamica-V2/commit/6ec358df09d4d31e4672abc2c651d43fc1fba3fa) Thanks [@sebasptsch](https://github.com/sebasptsch)! - Add healthcheck

## 3.0.7

### Patch Changes

- [`311b819`](https://github.com/DynamicaBot/Dynamica-V2/commit/311b819848a7490d845a81d4cc37d1e9c3b2c18d) Thanks [@sebasptsch](https://github.com/sebasptsch)! - checkout

## 3.0.6

### Patch Changes

- [`e96ade8`](https://github.com/DynamicaBot/Dynamica-V2/commit/e96ade848b067c43fbd6a83d2ab2fd243a25143c) Thanks [@sebasptsch](https://github.com/sebasptsch)! - Add latest to workflow

- [`f3706b7`](https://github.com/DynamicaBot/Dynamica-V2/commit/f3706b7948741e6c041f3fa75a24f187aa0088f2) Thanks [@sebasptsch](https://github.com/sebasptsch)! - Sentry Releases

## 3.0.5

### Patch Changes

- [`4829fe5`](https://github.com/DynamicaBot/Dynamica-V2/commit/4829fe56a0e4cc719e541998536400044b25f96a) Thanks [@sebasptsch](https://github.com/sebasptsch)! - Publish Pterodactyl and Default build from same run

## 3.0.4

### Patch Changes

- [`38c0309`](https://github.com/DynamicaBot/Dynamica-V2/commit/38c030905868a24afd36a3cd2fa0737f2114d238) Thanks [@sebasptsch](https://github.com/sebasptsch)! - fix release tags

## 3.0.3

### Patch Changes

- [`55c6093`](https://github.com/DynamicaBot/Dynamica-V2/commit/55c60930fb8abdff94d3df9620840504a4aac11f) Thanks [@sebasptsch](https://github.com/sebasptsch)! - Rework workflows

## 3.0.2

### Patch Changes

- [`bd6cb32`](https://github.com/DynamicaBot/Dynamica-V2/commit/bd6cb32c5fdf299ed5c0c583168a566b30c901d6) Thanks [@sebasptsch](https://github.com/sebasptsch)! - Remove zero fetch depth changeset release

## 3.0.1

### Patch Changes

- [`8b43f34`](https://github.com/DynamicaBot/Dynamica-V2/commit/8b43f34dfe4fe2b7c9ac2c64df9879c380f96703) Thanks [@sebasptsch](https://github.com/sebasptsch)! - Public Changeset

## 3.0.0

### Major Changes

- [#370](https://github.com/DynamicaBot/Dynamica-V2/pull/370) [`e00efdf`](https://github.com/DynamicaBot/Dynamica-V2/commit/e00efdf77635235a30bff3e924731addd03d5c05) Thanks [@sebasptsch](https://github.com/sebasptsch)! - Migrate to Postgres & Remove Prisma

  This change removes the project's dependency on Prisma and migrates the database from SQLite to Postgres. This change also includes the removal of the Prisma client and the Prisma schema file. The project now uses DrizzleORM to interact with the database.

  To migrate the database, run the following command inside the latest 2.x version of the project:

  ```bash
  node ./dist/utils/migrateToPostgres.js
  ```

  Making sure to have `POSTGRES_URL` set in the environment variables.

  After this spin down the 2.x version and spin up the 3.x version with the same `POSTGRES_URL` environment variable set.

### Minor Changes

- [#366](https://github.com/DynamicaBot/Dynamica-V2/pull/366) [`ccb88b5`](https://github.com/DynamicaBot/Dynamica-V2/commit/ccb88b5226602fd57312ed3360a95279d99a3ad5) Thanks [@sebasptsch](https://github.com/sebasptsch)! - Add Changeset CLI Versioning

- [#371](https://github.com/DynamicaBot/Dynamica-V2/pull/371) [`d7758f8`](https://github.com/DynamicaBot/Dynamica-V2/commit/d7758f8330837b7802320768effe1e65dd4baa4d) Thanks [@sebasptsch](https://github.com/sebasptsch)! - Add Support for ARM64
