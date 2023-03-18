import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { mainConfig } from '../config/main.config';
import { mailsConfig } from '../config/mails.config';
import { authConfig } from '../config/auth.config';
import { clientConfig } from '../config/client.config';
import { initBootstrap } from '../initBoostrap';
import * as SupertestSession from 'supertest-session';
import { SuperTest, Test as SuperTest_Test } from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { PrismaClient, Provider, Role } from '@prisma/client';
import { hashSync } from 'bcrypt';
import { UsersModule } from './users.module';
import { AuthModule } from '../auth/auth.module';

const prisma = new PrismaClient();

describe('UsersController', () => {
  let app: INestApplication;
  let adminSession: SuperTest<SuperTest_Test>;
  let userSession: SuperTest<SuperTest_Test>;

  const adminUser = {
    email: 'test-users_controller-admin-example@example.org',
    firstName: 'test-users_controller-admin-firstName',
    lastName: 'test-users_controller-admin-lastName',
    roles: [Role.ADMIN],
    provider: Provider.email,
    isVerified: false,
    id: undefined,
  };
  const adminUser_password = 'test-users_controller-admin-password';

  const defaultUser = {
    email: 'test-users_controller-default-example@example.org',
    firstName: 'test-users_controller-default-firstName',
    lastName: 'test-users_controller-default-lastName',
    roles: [Role.USER],
    provider: Provider.email,
    isVerified: false,
    id: undefined,
  };
  const defaultUser_password = 'test-users_controller-default-password';

  const createUser = {
    email: 'test-users_controller-create-example@example.org',
    firstName: 'test-users_controller-create-firstName',
    lastName: 'test-users_controller-create-lastName',
    roles: [Role.USER],
    provider: Provider.email,
    isVerified: false,
    id: undefined,
  };
  const createUser_password = 'test-users_controller-create-password';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [mainConfig, authConfig, mailsConfig, clientConfig],
        }),
        UsersModule,
        AuthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    initBootstrap(app);
    await app.init();

    adminUser.id = (
      await prisma.user.create({
        data: {
          ...adminUser,
          password: hashSync(adminUser_password, 10),
        },
      })
    ).id;

    defaultUser.id = (
      await prisma.user.create({
        data: {
          ...defaultUser,
          password: hashSync(defaultUser_password, 10),
        },
      })
    ).id;

    adminSession = SupertestSession(app.getHttpServer());
    await adminSession
      .get(
        `/auth/login?email=${adminUser.email}&password=test-users_controller-admin-password`,
      )
      .expect(302);

    userSession = SupertestSession(app.getHttpServer());
    await userSession
      .get(
        `/auth/login?email=${defaultUser.email}&password=test-users_controller-default-password`,
      )
      .expect(302);
  });

  it('protected', () => {
    return userSession.get('/users').expect(403);
  });

  describe('findAll', () => {
    it('all', async () => {
      const { body } = await adminSession.get('/users').expect(200);
      return expect(body).toEqual([
        expect.objectContaining(adminUser),
        expect.objectContaining(defaultUser),
      ]);
    });

    it('admin', async () => {
      const { body } = await adminSession
        .get(`/users?roles=${Role.ADMIN}`)
        .expect(200);
      return expect(body).toEqual([expect.objectContaining(adminUser)]);
    });

    it('email', async () => {
      const { body } = await adminSession
        .get(`/users?email=${defaultUser.email}`)
        .expect(200);
      return expect(body).toEqual([expect.objectContaining(defaultUser)]);
    });

    it('firstName', async () => {
      const { body } = await adminSession
        .get(`/users?firstName=${defaultUser.firstName}`)
        .expect(200);
      return expect(body).toEqual([expect.objectContaining(defaultUser)]);
    });

    it('lastName', async () => {
      const { body } = await adminSession
        .get(`/users?lastName=${defaultUser.lastName}`)
        .expect(200);
      return expect(body).toEqual([expect.objectContaining(defaultUser)]);
    });
  });

  it('create', async () => {
    const { body } = await adminSession
      .post(`/users`)
      .send({
        email: createUser.email,
        firstName: createUser.firstName,
        lastName: createUser.lastName,
        roles: createUser.roles,
        password: hashSync(createUser_password, 10),
      })
      .expect(201);
    createUser.id = body.id;
    return expect(body).toEqual(expect.objectContaining(createUser));
  });

  it('findOneByEmail', async () => {
    const { body } = await adminSession
      .get(`/users/email/${createUser.email}`)
      .expect(200);
    return expect(body).toEqual(expect.objectContaining(createUser));
  });

  it('patch', async () => {
    await adminSession
      .patch(`/users/${createUser.id}`)
      .send({
        firstName: `${createUser.firstName}-updated`,
      })
      .expect(200);
  });

  it('findOneById patched', async () => {
    const { body } = await adminSession
      .get(`/users/${createUser.id}`)
      .expect(200);
    return expect(body).toEqual(
      expect.objectContaining({
        ...createUser,
        firstName: `${createUser.firstName}-updated`,
      }),
    );
  });

  it('delete', async () => {
    await adminSession.delete(`/users/${createUser.id}`).expect(200);
    await adminSession.get(`/users/${createUser.id}`).expect(404);
  });

  afterAll(async () => {
    await app.close();
    await prisma.user.deleteMany({});
  });
});
