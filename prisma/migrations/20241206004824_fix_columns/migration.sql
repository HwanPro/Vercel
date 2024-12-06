/*
  Warnings:

  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.
  - Made the column `email` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `password` on table `User` required. This step will fail if there are existing NULL values in that column.
  - The required column `id` was added to the `VerificationToken` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "User" 
    ADD COLUMN "updatedAt" TIMESTAMP(3) DEFAULT NOW() NOT NULL,
    ALTER COLUMN "email" SET NOT NULL,
    ALTER COLUMN "password" SET NOT NULL;

-- AlterTable
ALTER TABLE "VerificationToken" ADD COLUMN "id" TEXT;
UPDATE "VerificationToken" SET "id" = gen_random_uuid(); -- Cambia por uuid_generate_v4() si es necesario
ALTER TABLE "VerificationToken" ALTER COLUMN "id" SET NOT NULL;
