import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SocketModule } from '../socket/socket.module';
import { ChatController } from './chat.controller';
import { UsersModule } from '../users/users.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [SocketModule, PrismaModule, UsersModule, StorageModule],
  providers: [ChatService, ChatGateway],
  exports: [ChatService],
  controllers: [ChatController],
})
export class ChatModule {}
