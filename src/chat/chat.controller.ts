import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import { Request } from 'express';
import { AddToChatDto } from './dto/controller/add-to-chat.input';
import { UsersService } from '../users/users.service';
import { ApiTags } from '@nestjs/swagger';
import { PrismaError } from 'prisma-error-enum';
import { CreateGroupDto } from './dto/controller/create-group.input';
import {
  ChatNotFoundError,
  EmptyNewMembersError,
  MemberNotInChat,
  WrongChatTypeError,
} from './chat.service.error';
import { RemoveFromChatDto } from './dto/controller/remove-from-chat.input';
import { ChatMemberGuard } from './guards/chat-member.guard';
import { ChatAdminGuard } from './guards/chat-admin.guard';
import { GetMessagesOptionsDto } from './dto/controller/get-messages-options.input';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly usersService: UsersService,
  ) {}

  @Get('private/:userId')
  @UseGuards(AuthenticatedGuard)
  async getPrivate(@Param('userId') userId: string, @Req() req: Request) {
    if (req.user.id == userId) throw new BadRequestException();
    try {
      return await this.chatService.getPrivate(req.user.id, userId);
    } catch (error) {
      if (error.code == PrismaError.RecordsNotFound)
        throw new NotFoundException();
      throw error;
    }
  }

  @Patch('private/:id/members/add')
  @UseGuards(AuthenticatedGuard, ChatMemberGuard)
  async addToPrivate(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() data: AddToChatDto,
  ) {
    if (data.membersToAdd.includes(req.user.id))
      throw new BadRequestException();
    try {
      return await this.chatService.addToPrivate(
        id,
        req.user.id,
        data.membersToAdd,
      );
    } catch (error) {
      if (error instanceof ChatNotFoundError)
        throw new NotFoundException(error);
      if (error instanceof WrongChatTypeError)
        throw new BadRequestException(error);
      if (error.code == PrismaError.RecordsNotFound)
        throw new NotFoundException(error);
      throw error;
    }
  }

  @Get('')
  @UseGuards(AuthenticatedGuard)
  getMyChats(@Req() req: Request) {
    return this.chatService.getChats(req.user.id);
  }

  @Get(':id')
  @UseGuards(AuthenticatedGuard)
  async getChat(@Param('id') id: string, @Req() req: Request) {
    const chat = await this.chatService.getChat(id);
    if (!chat) throw new NotFoundException();
    if (!chat.members.map((m) => m.id).includes(req.user.id))
      throw new ForbiddenException();
    return chat;
  }

  @Post('group')
  @UseGuards(AuthenticatedGuard)
  async createGroup(@Req() req: Request, @Body() data: CreateGroupDto) {
    return this.chatService.createGroup(data.newMembers.concat(req.user.id), [
      req.user.id,
    ]);
  }

  @Patch('group/:id/members/add')
  @UseGuards(AuthenticatedGuard, ChatAdminGuard)
  async addToGroup(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() data: AddToChatDto,
  ) {
    if (data.membersToAdd.length == 0) throw new BadRequestException();
    try {
      return await this.chatService.addToGroup(
        id,
        req.user.id,
        data.membersToAdd,
      );
    } catch (error) {
      if (error instanceof ChatNotFoundError)
        throw new NotFoundException(error);
      if (error instanceof WrongChatTypeError)
        throw new BadRequestException(error);
      if (error instanceof EmptyNewMembersError)
        throw new BadRequestException(error);
      if (error.code == PrismaError.RecordsNotFound)
        throw new NotFoundException(error);
      throw error;
    }
  }

  @Patch('group/:id/members/remove')
  @UseGuards(AuthenticatedGuard, ChatAdminGuard)
  async removeFromGroup(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() data: RemoveFromChatDto,
  ) {
    if (data.membersToRemove.length == 0) throw new BadRequestException();
    try {
      return await this.chatService.removeFromGroup(
        id,
        req.user.id,
        data.membersToRemove,
      );
    } catch (error) {
      if (error instanceof ChatNotFoundError)
        throw new NotFoundException(error);
      if (error instanceof WrongChatTypeError)
        throw new BadRequestException(error);
      if (error instanceof MemberNotInChat)
        throw new BadRequestException(error);
      if (error.code == PrismaError.RecordsNotFound)
        throw new NotFoundException(error);
      throw error;
    }
  }

  @Delete('group/:id')
  @UseGuards(AuthenticatedGuard, ChatAdminGuard)
  async deleteGroup(@Param('id') id: string) {
    try {
      return await this.chatService.deleteGroup(id);
    } catch (error) {
      if (error instanceof ChatNotFoundError)
        throw new NotFoundException(error);
      if (error instanceof WrongChatTypeError)
        throw new BadRequestException(error);
      throw error;
    }
  }

  @Get(':id/messages')
  async getMessages(
    @Param('id') chatId: string,
    @Query() query: GetMessagesOptionsDto,
  ) {
    return await this.chatService.getMessages(
      chatId,
      query.number,
      query.cursor,
    );
  }
}
