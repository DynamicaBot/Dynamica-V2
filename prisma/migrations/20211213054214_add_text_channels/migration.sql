-- AlterTable
ALTER TABLE "Secondary" ADD COLUMN "textChannelId" TEXT;

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Guild" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "textChannelsEnabled" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Guild" ("id") SELECT "id" FROM "Guild";
DROP TABLE "Guild";
ALTER TABLE "new_Guild" RENAME TO "Guild";
CREATE UNIQUE INDEX "Guild_id_key" ON "Guild"("id");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
