/*
  Warnings:

  - You are about to drop the column `properties` on the `Chat` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[propertiesId]` on the table `Chat` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `propertiesId` to the `Chat` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Chat" DROP COLUMN "properties",
ADD COLUMN     "propertiesId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "ChatProperties" (
    "id" TEXT NOT NULL,

    CONSTRAINT "ChatProperties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ChatPropertiesToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ChatProperties_id_key" ON "ChatProperties"("id");

-- CreateIndex
CREATE UNIQUE INDEX "_ChatPropertiesToUser_AB_unique" ON "_ChatPropertiesToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_ChatPropertiesToUser_B_index" ON "_ChatPropertiesToUser"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Chat_propertiesId_key" ON "Chat"("propertiesId");

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_propertiesId_fkey" FOREIGN KEY ("propertiesId") REFERENCES "ChatProperties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChatPropertiesToUser" ADD CONSTRAINT "_ChatPropertiesToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "ChatProperties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChatPropertiesToUser" ADD CONSTRAINT "_ChatPropertiesToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
