/*
  Warnings:

  - You are about to drop the column `textChannelId` on the `Secondary` table. All the data in the column will be lost.
  - You are about to drop the column `textChannelsEnabled` on the `Guild` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Secondary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "creator" TEXT,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "guildId" TEXT NOT NULL,
    "primaryId" TEXT NOT NULL,
    CONSTRAINT "Secondary_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Secondary_primaryId_fkey" FOREIGN KEY ("primaryId") REFERENCES "Primary" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Secondary" ("creator", "guildId", "id", "locked", "name", "primaryId") SELECT "creator", "guildId", "id", "locked", "name", "primaryId" FROM "Secondary";
DROP TABLE "Secondary";
ALTER TABLE "new_Secondary" RENAME TO "Secondary";
CREATE UNIQUE INDEX "Secondary_id_key" ON "Secondary"("id");
CREATE TABLE "new_Guild" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "allowJoinRequests" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Guild" ("allowJoinRequests", "id") SELECT "allowJoinRequests", "id" FROM "Guild";
DROP TABLE "Guild";
ALTER TABLE "new_Guild" RENAME TO "Guild";
CREATE UNIQUE INDEX "Guild_id_key" ON "Guild"("id");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
