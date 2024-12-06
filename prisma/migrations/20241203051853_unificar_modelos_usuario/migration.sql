/*
  Warnings:

  - You are about to drop the `UserAccount` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_UserMemberships` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `user_id` on table `ClientProfile` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "ClientProfile" DROP CONSTRAINT "ClientProfile_user_id_fkey";

-- DropForeignKey
ALTER TABLE "PaymentRecord" DROP CONSTRAINT "PaymentRecord_payer_user_id_fkey";

-- DropForeignKey
ALTER TABLE "UserContact" DROP CONSTRAINT "UserContact_contact_user_id_fkey";

-- DropForeignKey
ALTER TABLE "_UserMemberships" DROP CONSTRAINT "_UserMemberships_A_fkey";

-- DropForeignKey
ALTER TABLE "_UserMemberships" DROP CONSTRAINT "_UserMemberships_B_fkey";

-- AlterTable
ALTER TABLE "ClientProfile" ALTER COLUMN "profile_updated_at" DROP DEFAULT,
ALTER COLUMN "user_id" SET NOT NULL,
ALTER COLUMN "user_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "PaymentRecord" ALTER COLUMN "payer_user_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFASecret" TEXT;

-- AlterTable
ALTER TABLE "UserContact" ALTER COLUMN "contact_user_id" SET DATA TYPE TEXT;

-- DropTable
DROP TABLE "UserAccount";

-- DropTable
DROP TABLE "_UserMemberships";

-- CreateTable
CREATE TABLE "UserMembershipPlan" (
    "userId" TEXT NOT NULL,
    "membershipId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserMembershipPlan_pkey" PRIMARY KEY ("userId","membershipId")
);

-- AddForeignKey
ALTER TABLE "UserMembershipPlan" ADD CONSTRAINT "UserMembershipPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMembershipPlan" ADD CONSTRAINT "UserMembershipPlan_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "MembershipPlan"("membership_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_payer_user_id_fkey" FOREIGN KEY ("payer_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserContact" ADD CONSTRAINT "UserContact_contact_user_id_fkey" FOREIGN KEY ("contact_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientProfile" ADD CONSTRAINT "ClientProfile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
