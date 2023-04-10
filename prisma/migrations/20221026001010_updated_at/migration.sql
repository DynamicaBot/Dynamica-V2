-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Alias" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "activity" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Alias_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Alias" ("activity", "alias", "guildId", "id") SELECT "activity", "alias", "guildId", "id" FROM "Alias";
DROP TABLE "Alias";
ALTER TABLE "new_Alias" RENAME TO "Alias";
CREATE UNIQUE INDEX "Alias_guildId_activity_key" ON "Alias"("guildId", "activity");
CREATE TABLE "new_Guild" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "allowJoinRequests" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Guild" ("allowJoinRequests", "id") SELECT "allowJoinRequests", "id" FROM "Guild";
DROP TABLE "Guild";
ALTER TABLE "new_Guild" RENAME TO "Guild";
CREATE UNIQUE INDEX "Guild_id_key" ON "Guild"("id");
CREATE TABLE "new_Primary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creator" TEXT NOT NULL,
    "template" TEXT NOT NULL DEFAULT '@@game@@ ##',
    "generalName" TEXT NOT NULL DEFAULT 'General ##',
    "guildId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Primary_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Primary" ("creator", "generalName", "guildId", "id", "template") SELECT "creator", "generalName", "guildId", "id", "template" FROM "Primary";
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
    CONSTRAINT "Secondary_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Secondary_primaryId_fkey" FOREIGN KEY ("primaryId") REFERENCES "Primary" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Secondary" ("creator", "emoji", "guildId", "id", "locked", "name", "primaryId") SELECT "creator", "emoji", "guildId", "id", "locked", "name", "primaryId" FROM "Secondary";
DROP TABLE "Secondary";
ALTER TABLE "new_Secondary" RENAME TO "Secondary";
CREATE UNIQUE INDEX "Secondary_id_key" ON "Secondary"("id");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
