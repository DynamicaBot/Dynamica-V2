-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Secondary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "creator" TEXT,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "guildId" TEXT NOT NULL,
    "textChannelId" TEXT,
    "primaryId" TEXT NOT NULL,
    CONSTRAINT "Secondary_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Secondary_primaryId_fkey" FOREIGN KEY ("primaryId") REFERENCES "Primary" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Secondary" ("creator", "guildId", "id", "name", "primaryId", "textChannelId") SELECT "creator", "guildId", "id", "name", "primaryId", "textChannelId" FROM "Secondary";
DROP TABLE "Secondary";
ALTER TABLE "new_Secondary" RENAME TO "Secondary";
CREATE UNIQUE INDEX "Secondary_id_key" ON "Secondary"("id");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
