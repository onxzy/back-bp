-- CreateEnum
CREATE TYPE "Provider" AS ENUM ('email', 'google');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "provider" "Provider" NOT NULL DEFAULT 'email';
