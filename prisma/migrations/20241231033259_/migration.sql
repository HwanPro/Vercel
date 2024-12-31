-- AlterTable
ALTER TABLE "ClientProfile" ALTER COLUMN "profile_last_name" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "emailVerified" DROP NOT NULL;
