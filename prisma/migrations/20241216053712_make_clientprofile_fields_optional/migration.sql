-- AlterTable
ALTER TABLE "ClientProfile" ALTER COLUMN "profile_plan" DROP NOT NULL,
ALTER COLUMN "profile_start_date" DROP NOT NULL,
ALTER COLUMN "profile_end_date" DROP NOT NULL;
