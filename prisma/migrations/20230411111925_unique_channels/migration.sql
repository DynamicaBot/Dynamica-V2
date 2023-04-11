/*
  Warnings:

  - A unique constraint covering the columns `[guildId,id]` on the table `Secondary` will be added. If there are existing duplicate values, this will fail.
  - Made the column `guildId` on table `Primary` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Primary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creator" TEXT NOT NULL,
    "template" TEXT NOT NULL DEFAULT '@@game@@ ##',
    "generalName" TEXT NOT NULL DEFAULT 'General ##',
    "guildId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Primary_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Primary" ("createdAt", "creator", "generalName", "guildId", "id", "template", "updatedAt") SELECT "createdAt", "creator", "generalName", "guildId", "id", "template", "updatedAt" FROM "Primary";
DROP TABLE "Primary";
ALTER TABLE "new_Primary" RENAME TO "Primary";
CREATE UNIQUE INDEX "Primary_id_key" ON "Primary"("id");
CREATE UNIQUE INDEX "Primary_guildId_id_key" ON "Primary"("guildId", "id");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "Secondary_guildId_id_key" ON "Secondary"("guildId", "id");
