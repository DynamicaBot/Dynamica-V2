/*
  Warnings:

  - You are about to drop the column `primaryId` on the `Alias` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Alias" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "activity" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "guildId" TEXT,
    CONSTRAINT "Alias_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Alias" ("activity", "alias", "id") SELECT "activity", "alias", "id" FROM "Alias";
DROP TABLE "Alias";
ALTER TABLE "new_Alias" RENAME TO "Alias";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
