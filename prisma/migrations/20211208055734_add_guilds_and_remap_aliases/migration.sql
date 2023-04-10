/*
  Warnings:

  - Added the required column `guildId` to the `Secondary` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Guild" (
    "id" TEXT NOT NULL PRIMARY KEY
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Primary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creator" TEXT NOT NULL,
    "template" TEXT NOT NULL DEFAULT '@@game@@ ##',
    "generalName" TEXT NOT NULL DEFAULT 'General ##',
    "guildId" TEXT,
    CONSTRAINT "Primary_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Primary" ("creator", "generalName", "id", "template") SELECT "creator", "generalName", "id", "template" FROM "Primary";
DROP TABLE "Primary";
ALTER TABLE "new_Primary" RENAME TO "Primary";
CREATE UNIQUE INDEX "Primary_id_key" ON "Primary"("id");
CREATE TABLE "new_Secondary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "creator" TEXT,
    "guildId" TEXT NOT NULL,
    "primaryId" TEXT NOT NULL,
    CONSTRAINT "Secondary_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Secondary_primaryId_fkey" FOREIGN KEY ("primaryId") REFERENCES "Primary" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Secondary" ("creator", "id", "name", "primaryId") SELECT "creator", "id", "name", "primaryId" FROM "Secondary";
DROP TABLE "Secondary";
ALTER TABLE "new_Secondary" RENAME TO "Secondary";
CREATE UNIQUE INDEX "Secondary_id_key" ON "Secondary"("id");
CREATE TABLE "new_Alias" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "activity" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "primaryId" TEXT NOT NULL,
    CONSTRAINT "Alias_primaryId_fkey" FOREIGN KEY ("primaryId") REFERENCES "Guild" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Alias" ("activity", "alias", "id", "primaryId") SELECT "activity", "alias", "id", "primaryId" FROM "Alias";
DROP TABLE "Alias";
ALTER TABLE "new_Alias" RENAME TO "Alias";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "Guild_id_key" ON "Guild"("id");
