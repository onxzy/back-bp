-- AlterTable
ALTER TABLE "User" ADD COLUMN     "loggedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
