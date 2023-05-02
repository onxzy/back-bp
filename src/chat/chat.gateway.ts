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
import { ChatService } from './chat.service';
import {
  SEND_MESSAGE_EVENT,
  SendMessageDto,
} from './dto/gateway/send-message.input';
import { JOIN_CHAT_EVENT } from './dto/gateway/join-room.input';
import { RECEIVE_MESSAGE_EVENT } from './dto/gateway/receive-message.output';

@UsePipes(new ValidationPipe())
@UseFilters(new HttpExceptionsFilter())
@WebSocketGateway(socketConfig.namespaces.chat.gatewayMetadata)
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly socketService: SocketService,
    private readonly chatService: ChatService,
  ) {}

  afterInit() {
    this.socketService.initMiddlewares(this.server, 'chat');
    this.chatService.server = this.server;
  }

  handleConnection(socket: UserSocket) {
    this.chatService.socketLog(socket, 'Connected');
    if (socket.userId)
      socket.join(this.chatService.buildSocketRoomId(socket.userId, 'uid'));
  }

  handleDisconnect(socket: UserSocket) {
    this.chatService.socketLog(socket, 'Left');
  }

  @SubscribeMessage(JOIN_CHAT_EVENT)
  @UseGuards(AuthenticatedGuard)
  async joinChat(
    @ConnectedSocket() socket: UserSocket,
    @MessageBody() chatId: string,
  ) {
    const chat = await this.chatService.getChat(chatId);
    if (!chat) return false;
    if (!chat.members.map((m) => m.id).includes(socket.userId)) return false;

    socket.join(this.chatService.buildSocketRoomId(chatId, 'rid'));
    this.chatService.socketLog(socket, `Joined chat ${chatId}`);
    return true;
  }

  @SubscribeMessage(SEND_MESSAGE_EVENT)
  @UseGuards(AuthenticatedGuard)
  async msg(
    @ConnectedSocket() socket: UserSocket,
    @MessageBody() sendMessage: SendMessageDto,
  ) {
    await this.chatService.saveMessages(sendMessage.chatId, socket.userId, [
      {
        body: sendMessage.body,
        replyToId: sendMessage.replyToId,
      },
    ]);
    this.chatService.socketLog(socket, `${sendMessage.chatId} New message`);
    return true;
  }

  // On removed if self remove from room
}
