/*
  Warnings:

  - You are about to drop the column `profile_first_name` on the `ClientProfile` table. All the data in the column will be lost.
  - You are about to drop the column `profile_last_name` on the `ClientProfile` table. All the data in the column will be lost.
  - Made the column `lastName` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ClientProfile" DROP COLUMN "profile_first_name",
DROP COLUMN "profile_last_name";

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "lastName" SET NOT NULL;
