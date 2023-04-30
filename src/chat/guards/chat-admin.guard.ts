import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { ChatService } from '../../chat/chat.service';

@Injectable()
export class ChatAdminGuard implements CanActivate {
  constructor(private chatService: ChatService) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    const chat = await this.chatService.getChat(req.params.id);
    if (!chat) throw new NotFoundException();
    return chat.properties.admins.map((m) => m.id).includes(req.user.id);
  }
}
