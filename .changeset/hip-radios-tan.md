---
'dynamica-v2': major
---

Migrate to Postgres & Remove Prisma

This change removes the project's dependency on Prisma and migrates the database from SQLite to Postgres. This change also includes the removal of the Prisma client and the Prisma schema file. The project now uses DrizzleORM to interact with the database.

To migrate the database, run the following command inside the latest 3.x version of the project:

```bash
./dist/utils/migrateToPostgres.js
```

Making sure to have `POSTGRES_URL` set in the environment variables.

After this spin down the 3.x version and spin up the 4.x version with the same `POSTGRES_URL` environment variable set.
