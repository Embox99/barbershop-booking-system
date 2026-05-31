/*
  Warnings:

  - You are about to drop the column `optCode` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "optCode",
ADD COLUMN     "otpCode" TEXT;
