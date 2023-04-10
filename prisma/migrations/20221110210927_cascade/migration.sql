-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Primary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creator" TEXT NOT NULL,
    "template" TEXT NOT NULL DEFAULT '@@game@@ ##',
    "generalName" TEXT NOT NULL DEFAULT 'General ##',
    "guildId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Primary_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Primary" ("createdAt", "creator", "generalName", "guildId", "id", "template", "updatedAt") SELECT "createdAt", "creator", "generalName", "guildId", "id", "template", "updatedAt" FROM "Primary";
DROP TABLE "Primary";
ALTER TABLE "new_Primary" RENAME TO "Primary";
CREATE UNIQUE INDEX "Primary_id_key" ON "Primary"("id");
CREATE TABLE "new_Secondary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "creator" TEXT,
    "emoji" TEXT,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "guildId" TEXT NOT NULL,
    "primaryId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Secondary_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Secondary_primaryId_fkey" FOREIGN KEY ("primaryId") REFERENCES "Primary" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Secondary" ("createdAt", "creator", "emoji", "guildId", "id", "locked", "name", "primaryId", "updatedAt") SELECT "createdAt", "creator", "emoji", "guildId", "id", "locked", "name", "primaryId", "updatedAt" FROM "Secondary";
DROP TABLE "Secondary";
ALTER TABLE "new_Secondary" RENAME TO "Secondary";
CREATE UNIQUE INDEX "Secondary_id_key" ON "Secondary"("id");
CREATE TABLE "new_Alias" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "activity" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Alias_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Alias" ("activity", "alias", "createdAt", "guildId", "id", "updatedAt") SELECT "activity", "alias", "createdAt", "guildId", "id", "updatedAt" FROM "Alias";
DROP TABLE "Alias";
ALTER TABLE "new_Alias" RENAME TO "Alias";
CREATE UNIQUE INDEX "Alias_guildId_activity_key" ON "Alias"("guildId", "activity");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
