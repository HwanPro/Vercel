/*
  Warnings:

  - You are about to drop the column `firtsName` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "firtsName",
ADD COLUMN     "firstName" TEXT NOT NULL DEFAULT 'Sin nombre';
