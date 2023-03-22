import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { initBootstrap } from '../initBoostrap';
import {
  PrismaClient,
  Provider,
  Role,
  TokenType,
  User_Tokens,
} from '@prisma/client';
import { CookieAccessInfo } from 'cookiejar';
import * as supertest from 'supertest';
import { AppModule } from '../app.module';

const prisma = new PrismaClient();
const cookieAccessInfo = new CookieAccessInfo('127.0.0.1');

describe('AuthController', () => {
  let app: INestApplication;
  let configService: ConfigService;
  let request: supertest.SuperTest<supertest.Test>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    configService = moduleFixture.get<ConfigService>(ConfigService);

    app = moduleFixture.createNestApplication();
    initBootstrap(app);
    await app.init();
    request = supertest.agent(app.getHttpServer());
  });

  it('Unauthorized', (done) => {
    request.get('/auth/').expect(401, done);
  });

  describe(`Provider ${Provider.email}`, () => {
    let emailSession: supertest.SuperTest<supertest.Test>;

    const emailUser = {
      email: 'test-auth_controller-email-example@example.org',
      password: 'test-auth_controller-email-password',
      firstName: 'test-auth_controller-email-firstName',
      lastName: 'test-auth_controller-email-lastName',
      id: '',
    };
    let emailUser_token_verify: User_Tokens;
    let emailUser_token_recover: User_Tokens;

    beforeAll(() => {
      emailSession = supertest.agent(app.getHttpServer());
    });

    it('Register', async () => {
      const { body } = await emailSession
        .post('/auth/register')
        .send(emailUser)
        .expect(201);
      emailUser.id = body.id;

      emailUser_token_verify = await prisma.user_Tokens.findFirst({
        where: {
          userId: emailUser.id,
          type: TokenType.verification,
        },
      });
      expect(emailUser_token_verify).toEqual(
        expect.objectContaining({
          userId: emailUser.id,
          type: TokenType.verification,
        }),
      );

      return;
    });

    it('Login', async () => {
      await emailSession
        .get(
          `/auth/login?email=${emailUser.email}&password=${emailUser.password}`,
        )
        .expect(302)
        .expect('Location', /^\/auth/);

      const { body } = await emailSession.get('/auth/').expect(200);

      expect(body).toEqual(
        expect.objectContaining({
          email: emailUser.email,
          firstName: emailUser.firstName,
          lastName: emailUser.lastName,
          isVerified: false,
          provider: Provider.email,
          roles: [Role.USER],
        }),
      );
      expect(body).not.toHaveProperty('password');

      return;
    });

    it('Logout', async () => {
      await emailSession.delete('/auth/').expect(200);
      await emailSession.get('/auth/').expect(401);
      return;
    });

    it('Verify email', async () => {
      await emailSession
        .patch(`/auth/verify/${emailUser_token_verify.id}`)
        .expect(200);

      expect(
        (
          await prisma.user.findUnique({
            where: { id: emailUser.id },
          })
        ).isVerified,
      ).toBe(true);

      return;
    });

    describe('recover', () => {
      it('init', async () => {
        await emailSession.post(`/auth/recover/${emailUser.email}`).expect(201);

        emailUser_token_recover = await prisma.user_Tokens.findFirst({
          where: {
            userId: emailUser.id,
            type: TokenType.passwordReset,
          },
        });
        expect(emailUser_token_recover).toEqual(
          expect.objectContaining({
            userId: emailUser.id,
            type: TokenType.passwordReset,
          }),
        );

        return;
      });

      it('change password', async () => {
        await emailSession
          .patch(`/auth/password/${emailUser_token_recover.id}`)
          .send({
            email: emailUser.email,
            password: emailUser.password + '_new',
          })
          .expect(200);

        return;
      });

      it('login', async () => {
        await emailSession
          .get(
            `/auth/login?email=${emailUser.email}&password=${emailUser.password}`,
          )
          .expect(401);
        await emailSession
          .get(
            `/auth/login?email=${emailUser.email}&password=${emailUser.password}_new`,
          )
          .expect(302);

        return;
      });
    });

    describe('stay connected', () => {
      let stayConnectedSession: supertest.SuperTest<supertest.Test>;
      beforeAll(() => {
        stayConnectedSession = supertest.agent(app.getHttpServer());
      });

      it('get cookie', async () => {
        await emailSession.get('/auth?stay=true').expect(200);

        expect(
          emailSession.jar.getCookie(
            configService.get('auth.jwt.cookieName'),
            cookieAccessInfo,
          ),
        ).toEqual(
          expect.objectContaining({
            name: configService.get('auth.jwt.cookieName'),
            value: expect.anything(),
          }),
        );

        stayConnectedSession.jar.setCookie(
          emailSession.jar.getCookie(
            configService.get('auth.jwt.cookieName'),
            cookieAccessInfo,
          ),
        );

        return;
      });

      it('login', async () => {
        await stayConnectedSession.get('/auth').expect(200);
        return;
      });
    });

    it('Leave', async () => {
      await emailSession
        .get(
          `/auth/login?email=${emailUser.email}&password=${emailUser.password}_new`,
        )
        .expect(302);

      await emailSession.delete(`/auth/leave/${emailUser.id}`).expect(200);

      await emailSession
        .get(
          `/auth/login?email=${emailUser.email}&password=${emailUser.password}`,
        )
        .expect(401);

      return;
    });
  });

  // TODO: Auth Google

  afterAll(async () => {
    await app.close();
    await prisma.user.deleteMany({});
    return;
  });
});
