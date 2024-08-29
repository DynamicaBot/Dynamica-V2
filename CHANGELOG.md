# dynamica-v2

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
