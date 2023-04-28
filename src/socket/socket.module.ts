import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { SocketService } from './socket.service';

@Module({
  providers: [SocketService, ChatGateway],
  exports: [],
})
export class SocketModule {}
