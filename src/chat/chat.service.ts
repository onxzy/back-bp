import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Chat, ChatType, Prisma, User } from '@prisma/client';
import {
  ChatNotFoundError,
  CreatePrivateWithSelfError,
  EmptyMembersToAddError,
  EmptyNewMembersError,
  MemberNotInChat,
  MoreThan2InPrivateError,
  MultiplePrivateWithUserError,
  WrongChatTypeError,
} from './chat.service.error';

@Injectable()
export class ChatService {
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

    return this.createGroup(oldMembers.concat(newMembers), [ownerId]);
  }

  async addToGroup(id: string, membersToAdd: string[]) {
    if (membersToAdd.length == 0) throw new EmptyMembersToAddError();

    const groupChat = await this.getChat(id);
    if (!groupChat) throw new ChatNotFoundError();
    if (groupChat.type != ChatType.GROUP) throw new WrongChatTypeError();

    const oldMembers = groupChat.members.map((m) => m.id);
    const newMembers = membersToAdd.filter((id) => !oldMembers.includes(id));
    if (newMembers.length == 0) throw new EmptyNewMembersError();

    return await this.updateChat(id, newMembers, [], undefined);
  }

  async removeFromGroup(id: string, membersToRemove: string[]) {
    const groupChat = await this.getChat(id);
    if (!groupChat) throw new ChatNotFoundError();
    if (groupChat.type != ChatType.GROUP) throw new WrongChatTypeError();

    const oldMembers = groupChat.members.map((m) => m.id);
    const notInGroupMembers = membersToRemove.filter(
      (id) => !oldMembers.includes(id),
    );
    if (notInGroupMembers.length != 0) throw new MemberNotInChat();

    const chat = await this.updateChat(id, [], membersToRemove, undefined);

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

  // Save Message
  // Get Messages
  // Delete Message
}
