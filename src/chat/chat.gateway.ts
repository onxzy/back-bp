import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { config as socketConfig } from '../config/socket.config';
import {
  UseFilters,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import { HttpExceptionsFilter } from '../socket/filters/catch.filter';
import { SocketService, UserSocket } from '../socket/socket.service';

@UsePipes(new ValidationPipe())
@UseFilters(new HttpExceptionsFilter())
@WebSocketGateway(socketConfig.namespaces.chat.gatewayMetadata)
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly socketService: SocketService) {}

  afterInit() {
    this.socketService.initMiddlewares(this.server, 'chat');
  }

  @SubscribeMessage('msg')
  async msg(@MessageBody() data: any): Promise<any> {
    console.log(data);
    return 'received';
  }

  @SubscribeMessage('checkauth')
  @UseGuards(AuthenticatedGuard)
  checkAuth(@ConnectedSocket() client: UserSocket) {
    console.log(client.user);
    return 'auth';
  }
}
