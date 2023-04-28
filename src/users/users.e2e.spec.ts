import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { initApp } from '../initApp';
import { PrismaClient, Provider, Role } from '@prisma/client';
import { hashSync } from 'bcrypt';
import * as supertest from 'supertest';
import { AppModule } from '../app.module';
import { readFileSync, statSync } from 'fs';
import * as mime from 'mime';
import { StorageService } from '../storage/storage.service';
import { DeleteObjectCommand, ListObjectsCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { authConfig } from '../config/auth.config';

const prisma = new PrismaClient();

describe('UsersController', () => {
  let app: INestApplication;
  let storageService: StorageService;
  let configService: ConfigService;
  let adminSession: supertest.SuperTest<supertest.Test>;
  let userSession: supertest.SuperTest<supertest.Test>;
  let anonSession: supertest.SuperTest<supertest.Test>;

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

  const avatarPath = `${__dirname}/../../test/files/avatar.jpg`;
  const avatarFile = readFileSync(avatarPath);

  beforeAll(async () => {
    // Init Module
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    initApp(app);
    await app.init();
    configService = moduleFixture.get<ConfigService>(ConfigService);
    storageService = moduleFixture.get<StorageService>(StorageService);

    // Init Database
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

    // Init Sessions
    anonSession = supertest.agent(app.getHttpServer());

    adminSession = supertest.agent(app.getHttpServer());
    await adminSession
      .get(
        `/auth/login?email=${adminUser.email}&password=test-users_controller-admin-password`,
      )
      .expect(302);

    userSession = supertest.agent(app.getHttpServer());
    await userSession
      .get(
        `/auth/login?email=${defaultUser.email}&password=test-users_controller-default-password`,
      )
      .expect(302);

    // Init Storage
    await storageService.emptyBucket(
      configService.get<authConfig['avatar']['bucket']>('auth.avatar.bucket'),
    );
  });

  describe('admin CRUD', () => {
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

      return;
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
      return;
    });
  });

  describe('user CRUD', () => {
    it('protected', () => {
      return userSession.get('/users').expect(403);
    });

    describe('avatar', () => {
      it('no avatar', async () => {
        await userSession
          .get(`/users/${defaultUser.id}/avatar`)
          .redirects(1)
          .expect(404);
      });

      it('put avatar', async () => {
        const { headers } = await userSession
          .put(`/users/${defaultUser.id}/avatar`)
          .expect(302);
        expect(headers.location).toBeDefined();

        const { size: fileSize } = statSync(avatarPath);
        const { status } = await fetch(headers.location, {
          method: 'PUT',
          body: avatarFile,
          headers: {
            'Content-length': String(fileSize),
            'Content-type': mime.getType(avatarPath),
          },
        });
        expect(status).toBe(200);
      });

      it('get avatar', async () => {
        const { body } = await userSession
          .get(`/users/${defaultUser.id}/avatar`)
          .redirects(1)
          .expect(200);
        expect(body).toStrictEqual(avatarFile);
      });

      it('get avatar (anon)', async () => {
        const { body } = await anonSession
          .get(`/users/${defaultUser.id}/avatar`)
          .redirects(1)
          .expect(200);
        expect(body).toStrictEqual(avatarFile);
      });

      it('delete avatar', async () => {
        await userSession.delete(`/users/${defaultUser.id}/avatar`).expect(200);
      });
    });

    describe('anon CRUD', () => {
      it('protected', () => {
        return anonSession.get('/users').expect(401);
      });
    });
  });

  afterAll(async () => {
    await app.close();
    await prisma.user.deleteMany({});
    await storageService.emptyBucket(
      configService.get<authConfig['avatar']['bucket']>('auth.avatar.bucket'),
    );
    return;
  });
});
