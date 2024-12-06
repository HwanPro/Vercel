/*
  Warnings:

  - Made the column `contact_user_id` on table `UserContact` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "UserContact" DROP CONSTRAINT "UserContact_contact_user_id_fkey";

-- AlterTable
ALTER TABLE "UserContact" ALTER COLUMN "contact_user_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "UserContact" ADD CONSTRAINT "UserContact_contact_user_id_fkey" FOREIGN KEY ("contact_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
