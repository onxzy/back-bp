import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { initApp } from '../initApp';
import {
  Chat,
  ChatProperties,
  ChatType,
  PrismaClient,
  Provider,
  Role,
  User,
} from '@prisma/client';
import { hashSync } from 'bcrypt';
import * as supertest from 'supertest';
import { AppModule } from '../app.module';
import { randomUUID } from 'crypto';
import { ChatService, NewMessage } from './chat.service';

const prisma = new PrismaClient();

describe('ChatController', () => {
  let app: INestApplication;
  let chatService: ChatService;

  let adminSession: supertest.SuperTest<supertest.Test>;
  let userASession: supertest.SuperTest<supertest.Test>;
  let userBSession: supertest.SuperTest<supertest.Test>;
  let userCSession: supertest.SuperTest<supertest.Test>;
  // let anonSession: supertest.SuperTest<supertest.Test>;
  const initSession = async (
    session: supertest.SuperTest<supertest.Test>,
    user: any,
    password: string,
  ) => {
    await session
      .get(`/auth/login?email=${user.email}&password=${password}`)
      .expect(302);
  };

  const adminUser = {
    email: 'test-chat_controller-admin-example@example.org',
    firstName: 'test-chat_controller-admin-firstName',
    lastName: 'test-chat_controller-admin-lastName',
    roles: [Role.ADMIN],
    provider: Provider.email,
    isVerified: false,
    id: undefined,
  };
  const adminUser_password = 'test-chat_controller-admin-password';

  let userA: Awaited<ReturnType<typeof initUser>>;
  let userB: Awaited<ReturnType<typeof initUser>>;
  let userC: Awaited<ReturnType<typeof initUser>>;
  const initUser = async (prefix: string) => {
    const user = {
      email: `test-chat_controller-user${prefix}-example@example.org`,
      firstName: `test-chat_controller-user${prefix}-firstName`,
      lastName: `test-chat_controller-user${prefix}-lastName`,
      roles: [Role.USER],
      provider: Provider.email,
      isVerified: false,
      id: undefined,
    };
    user.id = (
      await prisma.user.create({
        data: {
          ...user,
          password: hashSync(user_password, 10),
        },
      })
    ).id;
    return user;
  };
  const user_password = 'test-chat_controller-user-password';

  let privateAB: Chat & {
    members: Partial<User>[];
    properties: ChatProperties;
  };
  let groupA: Chat & {
    members: Partial<User>[];
    properties: ChatProperties;
  };
  let groupB: Chat & {
    members: Partial<User>[];
    properties: ChatProperties;
  };

  beforeAll(async () => {
    let moduleFixture: TestingModule;

    // Init App and Database
    await Promise.all([
      // Init App
      (async () => {
        moduleFixture = await Test.createTestingModule({
          imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        initApp(app);
        await app.init();
        console.info('App initied');
      })(),

      // Init Database
      (async () => {
        adminUser.id = (
          await prisma.user.create({
            data: {
              ...adminUser,
              password: hashSync(adminUser_password, 10),
            },
          })
        ).id;
      })(),
      (async () => {
        userA = await initUser('A');
      })(),
      (async () => {
        userB = await initUser('B');
      })(),
      (async () => {
        userC = await initUser('C');
      })(),
    ]);

    // Init Sessions
    // anonSession = supertest.agent(app.getHttpServer());
    adminSession = supertest.agent(app.getHttpServer());
    [userASession, userBSession, userCSession] = [1, 2, 3].map(() =>
      supertest.agent(app.getHttpServer()),
    );
    await Promise.all([
      initSession(adminSession, adminUser, adminUser_password),
      initSession(userASession, userA, user_password),
      initSession(userBSession, userB, user_password),
      initSession(userCSession, userC, user_password),
    ]);

    chatService = app.get(ChatService);
  });

  describe('Controller', () => {
    describe('Private', () => {
      it('Create new', async () => {
        const { body } = await userASession
          .get(`/chat/private/${userB.id}`)
          .expect(200);
        expect(body.status).toBe('created');
        expect(body.chat.id).toHaveLength(36);
        privateAB = body.chat;
        expect(body.chat).toEqual(
          expect.objectContaining({
            type: ChatType.PRIVATE,
            title: null,
            properties: {
              id: expect.any(String),
              admins: [],
            },
          }),
        );
        expect(body.chat.members).toHaveLength(2);
        expect(body.chat.members).toEqual(
          expect.arrayContaining([
            {
              email: userA.email,
              firstName: userA.firstName,
              lastName: userA.lastName,
              id: userA.id,
            },
            {
              email: userB.email,
              firstName: userB.firstName,
              lastName: userB.lastName,
              id: userB.id,
            },
          ]),
        );
        return;
      });

      it('With self', async () => {
        await userASession.get(`/chat/private/${userA.id}`).expect(400);
        return;
      });

      it('User not found', async () => {
        await userASession.get(`/chat/private/${randomUUID()}`).expect(404);
        return;
      });

      it('Found existing', async () => {
        const { body } = await userBSession
          .get(`/chat/private/${userA.id}`)
          .expect(200);
        expect(body.status).toBe('found');
        expect(body.chat.id).toBe(privateAB.id);
        expect(body.chat).toEqual(
          expect.objectContaining({
            type: ChatType.PRIVATE,
            title: null,
            properties: {
              id: expect.any(String),
              admins: [],
            },
          }),
        );
        expect(body.chat.members).toHaveLength(2);
        expect(body.chat.members).toEqual(
          expect.arrayContaining([
            {
              email: userA.email,
              firstName: userA.firstName,
              lastName: userA.lastName,
              id: userA.id,
            },
            {
              email: userB.email,
              firstName: userB.firstName,
              lastName: userB.lastName,
              id: userB.id,
            },
          ]),
        );
        return;
      });

      it('Add self', async () => {
        await userASession
          .patch(`/chat/private/${privateAB.id}/members/add`)
          .send({
            membersToAdd: [userA.id],
          })
          .expect(400);
        return;
      });

      it('Add user not found', async () => {
        await userASession
          .patch(`/chat/private/${privateAB.id}/members/add`)
          .send({
            membersToAdd: [randomUUID()],
          })
          .expect(404);
        return;
      });

      it('Add user chat not existing', async () => {
        await userASession
          .patch(`/chat/private/${randomUUID()}/members/add`)
          .send({
            membersToAdd: [userB.id],
          })
          .expect(404);
        return;
      });

      it('Add user', async () => {
        const { body } = await userASession
          .patch(`/chat/private/${privateAB.id}/members/add`)
          .send({
            membersToAdd: [userC.id],
          })
          .expect(200);
        expect(body.id).not.toBe(privateAB.id);
        expect(body.properties).toEqual({
          id: expect.any(String),
          admins: [{ id: userA.id }],
        });
        expect(body.members).toHaveLength(3);
        expect(body.members).toEqual(
          expect.arrayContaining([
            {
              email: userA.email,
              firstName: userA.firstName,
              lastName: userA.lastName,
              id: userA.id,
            },
            {
              email: userB.email,
              firstName: userB.firstName,
              lastName: userB.lastName,
              id: userB.id,
            },
            {
              email: userC.email,
              firstName: userC.firstName,
              lastName: userC.lastName,
              id: userC.id,
            },
          ]),
        );
        groupA = body;
        return;
      });

      it('Remove member from private', async () => {
        await userASession
          .patch(`/chat/group/${privateAB.id}/members/remove`)
          .send({
            membersToRemove: [userB.id],
          })
          .expect(403);
        return;
      });
    });

    describe('Group', () => {
      it('Create new', async () => {
        const { body } = await userASession
          .post(`/chat/group`)
          .send({
            newMembers: [userB.id],
          })
          .expect(201);
        expect(body.id).toHaveLength(36);
        expect(body).toEqual(
          expect.objectContaining({
            type: ChatType.GROUP,
            title: null,
            properties: {
              id: expect.any(String),
              admins: [{ id: userA.id }],
            },
          }),
        );
        expect(body.members).toHaveLength(2);
        expect(body.members).toEqual(
          expect.arrayContaining([
            {
              email: userA.email,
              firstName: userA.firstName,
              lastName: userA.lastName,
              id: userA.id,
            },
            {
              email: userB.email,
              firstName: userB.firstName,
              lastName: userB.lastName,
              id: userB.id,
            },
          ]),
        );
        groupB = body;
        return;
      });

      it('Add user', async () => {
        const { body } = await userASession
          .patch(`/chat/group/${groupB.id}/members/add`)
          .send({
            membersToAdd: [userC.id],
          })
          .expect(200);
        expect(body.members).toHaveLength(3);
        expect(body.members).toEqual(
          expect.arrayContaining([
            {
              email: userA.email,
              firstName: userA.firstName,
              lastName: userA.lastName,
              id: userA.id,
            },
            {
              email: userB.email,
              firstName: userB.firstName,
              lastName: userB.lastName,
              id: userB.id,
            },
            {
              email: userC.email,
              firstName: userC.firstName,
              lastName: userC.lastName,
              id: userC.id,
            },
          ]),
        );
        groupB = body;
        return;
      });

      it('Add user not found', async () => {
        await userASession
          .patch(`/chat/group/${groupB.id}/members/add`)
          .send({
            membersToAdd: [randomUUID()],
          })
          .expect(404);
        return;
      });

      it('Remove member', async () => {
        const { body } = await userASession
          .patch(`/chat/group/${groupA.id}/members/remove`)
          .send({
            membersToRemove: [userC.id],
          })
          .expect(200);
        expect(body.action).toBe('userRemoved');
        expect(body.chat.members).toHaveLength(2);
        expect(body.chat.members).toEqual(
          expect.arrayContaining([
            {
              email: userA.email,
              firstName: userA.firstName,
              lastName: userA.lastName,
              id: userA.id,
            },
            {
              email: userB.email,
              firstName: userB.firstName,
              lastName: userB.lastName,
              id: userB.id,
            },
          ]),
        );
        groupA = body.chat;
        return;
      });

      it('Remove member not in group', async () => {
        await userASession
          .patch(`/chat/group/${groupA.id}/members/remove`)
          .send({
            membersToRemove: [userC.id],
          })
          .expect(400);
        return;
      });

      it('Remove member chat not existing', async () => {
        await userASession
          .patch(`/chat/group/${randomUUID()}/members/remove`)
          .send({
            membersToRemove: [userB.id],
          })
          .expect(404);
        return;
      });

      it('Get chat list', async () => {
        const { body } = await userASession.get(`/chat`).expect(200);
        expect(body).toEqual(
          expect.arrayContaining([
            {
              id: privateAB.id,
              type: privateAB.type,
              title: privateAB.title,
              propertiesId: privateAB.properties.id,
              properties: privateAB.properties,
              members: privateAB.members,
              _count: expect.objectContaining({ members: 2 }),
            },
            {
              id: groupA.id,
              type: groupA.type,
              title: groupA.title,
              propertiesId: groupA.properties.id,
              properties: groupA.properties,
              _count: expect.objectContaining({ members: 2 }),
            },
            {
              id: groupB.id,
              type: groupB.type,
              title: groupB.title,
              propertiesId: groupB.properties.id,
              properties: groupB.properties,
              _count: expect.objectContaining({ members: 3 }),
            },
          ]),
        );
        return;
      });

      it('Get chat', async () => {
        const { body } = await userASession
          .get(`/chat/${groupA.id}`)
          .expect(200);
        expect(body).toEqual({
          id: groupA.id,
          type: groupA.type,
          title: groupA.title,
          propertiesId: groupA.properties.id,
          properties: groupA.properties,
          members: expect.arrayContaining([
            {
              email: userA.email,
              firstName: userA.firstName,
              lastName: userA.lastName,
              id: userA.id,
            },
            {
              email: userB.email,
              firstName: userB.firstName,
              lastName: userB.lastName,
              id: userB.id,
            },
          ]),
        });
        return;
      });

      it('Chat not found', async () => {
        await userASession.get(`/chat/${randomUUID}`).expect(404);
        return;
      });
    });

    describe('Messages', () => {
      const newMessages: NewMessage<'STANDARD'>[] = [];
      for (let i = 0; i < 100; i++) {
        newMessages.push({
          body: {
            txt: `msg-${i}`,
          },
        });
      }

      beforeAll(async () => {
        for (const m of newMessages) {
          await chatService.saveMessages(groupB.id, userA.id, [m]);
        }
      });

      it('Get', async () => {
        const { body } = await userASession
          .get(`/chat/${groupB.id}/messages`)
          .expect(200);
        expect(body).toEqual(
          expect.arrayContaining(
            newMessages.slice(80, 99).map((m) =>
              expect.objectContaining({
                body: m.body,
                chatId: groupB.id,
                replyToId: null,
              }),
            ),
          ),
        );
      });

      it('Get with cursor', async () => {
        const { body } = await userASession
          .get(`/chat/${groupB.id}/messages`)
          .query({ cursor: 80 + 4 }) // +4 due to above group creation messages
          .expect(200);
        expect(body).toEqual(
          expect.arrayContaining(
            newMessages.slice(60, 79).map((m) =>
              expect.objectContaining({
                body: m.body,
                chatId: groupB.id,
                replyToId: null,
              }),
            ),
          ),
        );
      });
    });

    describe('Delete', () => {
      it('Private', async () => {
        await userASession.delete(`/chat/group/${privateAB.id}`).expect(403);
        return;
      });

      it('Make group empty', async () => {
        const { body } = await userASession
          .patch(`/chat/group/${groupA.id}/members/remove`)
          .send({
            membersToRemove: [userA.id, userB.id],
          })
          .expect(200);
        expect(body.action).toBe('chatDeleted');
        return;
      });

      it('Not found', async () => {
        await userASession.delete(`/chat/group/${groupA.id}`).expect(404);
        return;
      });

      it('Group', async () => {
        await userASession.delete(`/chat/group/${groupB.id}`).expect(200);
        return;
      });
    });

    // TODO: Auth & permissions tests
  });

  afterAll(async () => {
    await app.close();
    await prisma.chat.deleteMany({});
    await prisma.user.deleteMany({});

    await prisma.message.deleteMany({});
    return;
  });
});
