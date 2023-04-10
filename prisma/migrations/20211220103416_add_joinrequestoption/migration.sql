-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Guild" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "textChannelsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "allowJoinRequests" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Guild" ("id", "textChannelsEnabled") SELECT "id", "textChannelsEnabled" FROM "Guild";
DROP TABLE "Guild";
ALTER TABLE "new_Guild" RENAME TO "Guild";
CREATE UNIQUE INDEX "Guild_id_key" ON "Guild"("id");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
