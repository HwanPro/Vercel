/*
  Warnings:

  - You are about to drop the `News` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "checkOutTime" TIMESTAMP(3);

-- DropTable
DROP TABLE "News";
