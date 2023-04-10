/*
  Warnings:

  - You are about to drop the column `managerRoleId` on the `Guild` table. All the data in the column will be lost.
  - Made the column `guildId` on table `Alias` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Alias" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "activity" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    CONSTRAINT "Alias_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Alias" ("activity", "alias", "guildId", "id") SELECT "activity", "alias", "guildId", "id" FROM "Alias";
DROP TABLE "Alias";
ALTER TABLE "new_Alias" RENAME TO "Alias";
CREATE UNIQUE INDEX "Alias_guildId_activity_key" ON "Alias"("guildId", "activity");
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
