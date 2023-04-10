/*
  Warnings:

  - A unique constraint covering the columns `[managerRoleId]` on the table `Guild` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Guild" ADD COLUMN "managerRoleId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Guild_managerRoleId_key" ON "Guild"("managerRoleId");
