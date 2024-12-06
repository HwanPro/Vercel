/*
  Warnings:

  - The primary key for the `ClientProfile` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "ClientProfile" DROP CONSTRAINT "ClientProfile_pkey",
ALTER COLUMN "profile_id" DROP DEFAULT,
ALTER COLUMN "profile_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "ClientProfile_pkey" PRIMARY KEY ("profile_id");
DROP SEQUENCE "ClientProfile_profile_id_seq";
