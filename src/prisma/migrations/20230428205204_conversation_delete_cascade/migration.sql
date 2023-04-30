-- DropForeignKey
ALTER TABLE "ConversationsOnUsers" DROP CONSTRAINT "ConversationsOnUsers_conversationId_fkey";

-- AddForeignKey
ALTER TABLE "ConversationsOnUsers" ADD CONSTRAINT "ConversationsOnUsers_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
