/*
  Warnings:

  - A unique constraint covering the columns `[userId,type]` on the table `User_Tokens` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "User_Tokens" DROP CONSTRAINT "User_Tokens_userId_fkey";

-- CreateIndex
CREATE UNIQUE INDEX "User_Tokens_userId_type_key" ON "User_Tokens"("userId", "type");

-- AddForeignKey
ALTER TABLE "User_Tokens" ADD CONSTRAINT "User_Tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
