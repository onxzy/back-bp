import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { ChatService } from '../../chat/chat.service';

@Injectable()
export class ChatMemberGuard implements CanActivate {
  constructor(private chatService: ChatService) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    if (!req.params.id) throw new BadRequestException();
    const chat = await this.chatService.getChat(req.params.id);
    if (!chat) throw new NotFoundException();
    return chat.members.map((m) => m.id).includes(req.user.id);
  }
}
