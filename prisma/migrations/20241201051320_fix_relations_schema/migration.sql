/*
  Warnings:

  - The primary key for the `ClientProfile` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `profile_id` column on the `ClientProfile` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[user_id]` on the table `ClientProfile` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ClientProfile" DROP CONSTRAINT "ClientProfile_pkey",
ADD COLUMN     "user_id" INTEGER,
DROP COLUMN "profile_id",
ADD COLUMN     "profile_id" SERIAL NOT NULL,
ADD CONSTRAINT "ClientProfile_pkey" PRIMARY KEY ("profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "ClientProfile_user_id_key" ON "ClientProfile"("user_id");

-- AddForeignKey
ALTER TABLE "ClientProfile" ADD CONSTRAINT "ClientProfile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "UserAccount"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
