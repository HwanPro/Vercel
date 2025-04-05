/*
  Warnings:

  - You are about to drop the column `gender` on the `ClientProfile` table. All the data in the column will be lost.
  - You are about to drop the column `isManual` on the `ClientProfile` table. All the data in the column will be lost.
  - You are about to drop the column `profile_created_at` on the `ClientProfile` table. All the data in the column will be lost.
  - You are about to drop the column `profile_updated_at` on the `ClientProfile` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "ClientProfile_profile_phone_key";

-- AlterTable
ALTER TABLE "ClientProfile" DROP COLUMN "gender",
DROP COLUMN "isManual",
DROP COLUMN "profile_created_at",
DROP COLUMN "profile_updated_at",
ADD COLUMN     "profile_first_name" TEXT,
ADD COLUMN     "profile_last_name" TEXT,
ALTER COLUMN "profile_emergency_phone" DROP DEFAULT;
