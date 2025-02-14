-- AlterTable
ALTER TABLE "ClientProfile" ALTER COLUMN "profile_first_name" SET DEFAULT '',
ALTER COLUMN "profile_last_name" SET DEFAULT '',
ALTER COLUMN "profile_emergency_phone" SET DEFAULT '',
ALTER COLUMN "profile_phone" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "verificationTokenId" TEXT;

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("token")
);

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_userId_key" ON "PasswordResetToken"("userId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_verificationTokenId_fkey" FOREIGN KEY ("verificationTokenId") REFERENCES "VerificationToken"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
