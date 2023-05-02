import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  Chat,
  ChatType,
  MessageType,
  Message as MessageWithJsonBody,
  Prisma,
  User,
} from '@prisma/client';
import {
  ChatNotFoundError,
  CreatePrivateWithSelfError,
  EmptyMembersToAddError,
  EmptyNewMembersError,
  MemberNotInChat,
  MoreThan2InPrivateError,
  MultiplePrivateWithUserError,
  RepliedIdNotFound,
  WrongChatTypeError,
} from './chat.service.error';
import { UserSocket } from '../socket/socket.service';
import { Server } from 'socket.io';
import { RECEIVE_MESSAGE_EVENT } from './dto/gateway/receive-message.output';

export type Message<
  T extends MessageType = MessageType,
  E extends MessageEventType = MessageEventType,
> = Omit<MessageWithJsonBody, 'body'> & {
  body: MessageBody<T, E>;
};

export type MessageAttachment = {
  name: string;
  object: string;
};

export enum MessageEventType {
  MEMBERS_ADDED = 'MEMBERS_ADDED',
  MEMBERS_REMOVED = 'MEMBERS_REMOVED',
  TITLE_UPDATED = 'TITLE_UPDATED',
  GROUP_CREATED = 'GROUP_CREATED',
}

export type MessageEventPayload<E extends MessageEventType = MessageEventType> =
  E extends MessageEventType.MEMBERS_ADDED | MessageEventType.MEMBERS_REMOVED
    ? {
        by?: string;
        membersId: string[];
      }
    : E extends MessageEventType.TITLE_UPDATED
    ? {
        by?: string;
        old: Chat['title'];
        new: Chat['title'];
      }
    : E extends MessageEventType.GROUP_CREATED
    ? {
        by?: string;
      }
    : null;

export type MessageBody<
  T extends MessageType,
  E extends MessageEventType,
> = T extends 'STANDARD'
  ? {
      txt: string;
      attachments?: MessageAttachment[];
    }
  : {
      type: MessageEventType;
      data: MessageEventPayload<E>;
    };

export type NewMessage<
  T extends MessageType = MessageType,
  E extends MessageEventType = MessageEventType,
> = {
  body: MessageBody<T, E>;
  replyToId?: number;
};

@Injectable()
export class ChatService {
  server: Server;

  constructor(private readonly prisma: PrismaService) {}

  async getPrivate(userId: string, otherUserId: string) {
    if (userId == otherUserId) throw new CreatePrivateWithSelfError(userId);

    const chats = await this.prisma.chat.findMany({
      where: {
        type: ChatType.PRIVATE,
        members: {
          some: { id: userId },
        },
      },
      include: {
        members: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            id: true,
          },
        },
        properties: {
          include: {
            admins: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });
    const privates: typeof chats = [];
    for (const c of chats) {
      const membersId = c.members.map((user) => user.id);
      if (membersId.includes(otherUserId)) privates.push(c);
    }

    if (privates.length == 0) {
      return {
        status: 'created',
        chat: await this.createPrivate(userId, otherUserId),
      } as const;
    } else if (privates.length == 1) {
      return {
        status: 'found',
        chat: privates[0],
      } as const;
    } else {
      throw new MultiplePrivateWithUserError(`${userId}-${otherUserId}`);
    }
  }

  // TODO: Update Private Properties

  private async createPrivate(userId: string, otherUserId: string) {
    return await this.createChat(ChatType.PRIVATE, [userId, otherUserId]);
  }

  async createGroup(newMembers: string[], ownersId: string[]) {
    if (newMembers.length == 0) throw new EmptyNewMembersError();
    return await this.createChat(ChatType.GROUP, newMembers, ownersId);
  }

  async addToPrivate(id: string, ownerId: string, membersToAdd: string[]) {
    if (membersToAdd.length == 0) throw new EmptyMembersToAddError();

    const privateChat = await this.getChat(id);
    if (!privateChat) throw new ChatNotFoundError();
    if (privateChat.type != ChatType.PRIVATE) throw new WrongChatTypeError(id);

    const oldMembers = privateChat.members.map((m) => m.id);
    if (oldMembers.length > 2) throw new MoreThan2InPrivateError(id);

    const newMembers = membersToAdd.filter((id) => !oldMembers.includes(id));
    if (newMembers.length == 0) throw new EmptyNewMembersError();

    const chat = await this.createGroup(oldMembers.concat(newMembers), [
      ownerId,
    ]);

    await this.saveMessages(chat.id, ownerId, [
      {
        body: {
          type: MessageEventType.GROUP_CREATED,
          data: {
            by: ownerId,
          },
        },
      } as NewMessage<'EVENT', MessageEventType.GROUP_CREATED>,
    ]);
    return chat;
  }

  async addToGroup(id: string, byId: string, membersToAdd: string[]) {
    if (membersToAdd.length == 0) throw new EmptyMembersToAddError();

    const groupChat = await this.getChat(id);
    if (!groupChat) throw new ChatNotFoundError();
    if (groupChat.type != ChatType.GROUP) throw new WrongChatTypeError();

    const oldMembers = groupChat.members.map((m) => m.id);
    const newMembers = membersToAdd.filter((id) => !oldMembers.includes(id));
    if (newMembers.length == 0) throw new EmptyNewMembersError();

    const chat = await this.updateChat(id, newMembers, [], undefined);

    await this.saveMessages(chat.id, byId, [
      {
        body: {
          type: MessageEventType.MEMBERS_ADDED,
          data: {
            by: byId,
            membersId: newMembers,
          },
        },
      } as NewMessage<'EVENT', MessageEventType.MEMBERS_ADDED>,
    ]);

    return chat;
  }

  async removeFromGroup(id: string, byId: string, membersToRemove: string[]) {
    const groupChat = await this.getChat(id);
    if (!groupChat) throw new ChatNotFoundError();
    if (groupChat.type != ChatType.GROUP) throw new WrongChatTypeError();

    const oldMembers = groupChat.members.map((m) => m.id);
    const notInGroupMembers = membersToRemove.filter(
      (id) => !oldMembers.includes(id),
    );
    if (notInGroupMembers.length != 0) throw new MemberNotInChat();

    const chat = await this.updateChat(id, [], membersToRemove, undefined);

    await this.saveMessages(chat.id, byId, [
      {
        body: {
          type: MessageEventType.MEMBERS_REMOVED,
          data: {
            by: byId,
            membersId: membersToRemove,
          },
        },
      } as NewMessage<'EVENT', MessageEventType.MEMBERS_REMOVED>,
    ]);

    if (chat.members.length == 0) {
      await this.deleteGroup(id);
      return {
        action: 'chatDeleted',
      } as const;
    }

    return {
      action: 'userRemoved',
      chat,
    } as const;
  }

  // TODO: Update Group Properties
  async deleteGroup(id: string) {
    const groupChat = await this.getChat(id);
    if (!groupChat) throw new ChatNotFoundError();
    if (groupChat.type != ChatType.GROUP) throw new WrongChatTypeError();
    return await this.deleteChat(id);
  }

  async getChat(id: string) {
    return await this.prisma.chat.findUnique({
      where: { id },
      include: {
        members: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            id: true,
          },
        },
        properties: {
          include: {
            admins: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });
  }

  async getChats(userId: string, type: ChatType = undefined) {
    let userWithGroup: User & {
      chats: (Chat & {
        _count: Prisma.ChatCountOutputType;
        members?: {
          id: string;
          email: string;
          firstName: string;
          lastName: string;
        }[];
      })[];
    };
    let userWithPrivate: User & {
      chats: (Chat & {
        _count: Prisma.ChatCountOutputType;
        members?: {
          id: string;
          email: string;
          firstName: string;
          lastName: string;
        }[];
      })[];
    };

    if (type == undefined || type == ChatType.GROUP) {
      userWithGroup = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          chats: {
            where: { type: ChatType.GROUP },
            include: {
              _count: true,
              properties: {
                include: {
                  admins: {
                    select: {
                      id: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    }
    if (type == undefined || type == ChatType.PRIVATE) {
      userWithPrivate = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          chats: {
            where: { type: ChatType.PRIVATE },
            include: {
              _count: true,
              properties: {
                include: {
                  admins: {
                    select: {
                      id: true,
                    },
                  },
                },
              },
              members: {
                select: {
                  email: true,
                  firstName: true,
                  lastName: true,
                  id: true,
                },
              },
            },
          },
        },
      });
    }
    return userWithGroup.chats.concat(userWithPrivate.chats);
  }

  private async createChat(
    type: ChatType,
    members: string[],
    ownersId: string[] = [],
  ) {
    return await this.prisma.chat.create({
      data: {
        type,
        properties: {
          create: {
            admins: {
              connect: ownersId.map((id) => ({ id })),
            },
          },
        },
        members: {
          connect: members.map((id) => ({ id })),
        },
      },
      include: {
        properties: {
          include: {
            admins: {
              select: {
                id: true,
              },
            },
          },
        },
        members: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            id: true,
          },
        },
      },
    });
  }

  private async updateChat(
    id: string,
    membersToAdd: string[] = [],
    membersToRemove: string[] = [],
    type: ChatType = undefined,
  ) {
    return await this.prisma.chat.update({
      where: { id },
      data: {
        type,
        members: {
          connect: membersToAdd.map((id) => ({ id })),
          disconnect: membersToRemove.map((id) => ({ id })),
        },
      },
      include: {
        properties: {
          include: {
            admins: {
              select: {
                id: true,
              },
            },
          },
        },
        members: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            id: true,
          },
        },
      },
    });
  }

  // TODO: Check: delete messages, don't delete users
  private async deleteChat(id: string) {
    return await this.prisma.chat.delete({ where: { id } });
  }

  async saveMessages(
    chatId: string,
    senderId: string,
    newMessages: NewMessage[],
  ) {
    const chat = await this.getChat(chatId);
    if (!chat) throw new ChatNotFoundError();
    if (!chat.members.map((m) => m.id).includes(senderId))
      throw new MemberNotInChat();

    // Remove repliedTo not in same chatId
    const replyToIds = newMessages.map((m) => m.replyToId).filter((v) => v);
    const repliedMessages = await this.prisma.message.findMany({
      where: {
        id: {
          in: replyToIds,
        },
      },
    });
    if (replyToIds.length != repliedMessages.length)
      throw new RepliedIdNotFound();
    const replyToIdsToRemove = repliedMessages.map((r) => {
      if (r.chatId != chatId) return r.id;
    });
    const newMessagesWithoutBadReplies = newMessages.map((m) => {
      if (!replyToIdsToRemove.includes(m.replyToId)) return m;
      return { body: m.body };
    });

    const messages = (await this.prisma.$transaction(
      newMessagesWithoutBadReplies.map((msg) =>
        this.prisma.message.create({
          data: {
            chatId,
            senderId,
            body: msg.body,
            replyToId: msg.replyToId,
          },
        }),
      ),
    )) as Message[];

    this.sendMessages(chatId, messages);
  }

  sendMessages(chatId: string, messages: Message[]) {
    this.server
      .to(this.buildSocketRoomId(chatId, 'rid'))
      .emit(RECEIVE_MESSAGE_EVENT, messages);
  }

  async getMessages(chatId: string, number = 20, cursor: number = undefined) {
    const messages = (await this.prisma.message.findMany({
      where: { chatId },
      orderBy: {
        createdAt: 'desc',
      },
      skip: cursor ? 1 : undefined,
      take: number,
      cursor: cursor
        ? {
            id: cursor,
          }
        : undefined,
    })) as Message[];
    return messages;
  }

  async deleteMessage(id: number) {
    return await this.prisma.message.update({
      where: {
        id,
      },
      data: {
        body: {},
      },
    });
  }

  buildSocketRoomId(id: string, type: 'uid' | 'rid') {
    return type + '.' + id;
  }

  socketLog(socket: UserSocket, msg: string) {
    console.debug(
      `[Chat] ${socket.userId ? socket.user.email : '0'} @${socket.id} ${msg}`,
    );
  }
}
