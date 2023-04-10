-- CreateTable
CREATE TABLE "Primary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creator" TEXT NOT NULL,
    "template" TEXT NOT NULL DEFAULT '@@game@@ ##',
    "generalName" TEXT NOT NULL DEFAULT 'General ##'
);

-- CreateTable
CREATE TABLE "Secondary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "primaryId" TEXT NOT NULL,
    CONSTRAINT "Secondary_primaryId_fkey" FOREIGN KEY ("primaryId") REFERENCES "Primary" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Alias" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "activity" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "primaryId" TEXT NOT NULL,
    CONSTRAINT "Alias_primaryId_fkey" FOREIGN KEY ("primaryId") REFERENCES "Primary" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Primary_id_key" ON "Primary"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Secondary_id_key" ON "Secondary"("id");
