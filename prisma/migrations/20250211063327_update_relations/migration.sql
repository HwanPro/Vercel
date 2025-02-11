/*
  Warnings:

  - A unique constraint covering the columns `[profile_phone]` on the table `ClientProfile` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ClientProfile_profile_phone_key" ON "ClientProfile"("profile_phone");
