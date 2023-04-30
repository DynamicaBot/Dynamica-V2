-- RedefineTables
PRAGMA foreign_keys=OFF;
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
    "lastName" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "Secondary_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Secondary_primaryId_fkey" FOREIGN KEY ("primaryId") REFERENCES "Primary" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Secondary" ("createdAt", "creator", "emoji", "guildId", "id", "locked", "name", "primaryId", "updatedAt") SELECT "createdAt", "creator", "emoji", "guildId", "id", "locked", "name", "primaryId", "updatedAt" FROM "Secondary";
DROP TABLE "Secondary";
ALTER TABLE "new_Secondary" RENAME TO "Secondary";
CREATE UNIQUE INDEX "Secondary_id_key" ON "Secondary"("id");
CREATE UNIQUE INDEX "Secondary_guildId_id_key" ON "Secondary"("guildId", "id");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
