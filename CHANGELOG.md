# dynamica-v2

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
