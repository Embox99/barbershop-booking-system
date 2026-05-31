/*
  Warnings:

  - You are about to drop the column `otpTime` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "otpTime",
ADD COLUMN     "otpExpires" TIMESTAMP(3);
