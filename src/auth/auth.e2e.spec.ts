import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailsModule } from '../mails/mails.module';
import { AuthService } from './auth.service';
import { LocalStrategy } from './strategies/local.strategy';
import { GoogleStrategy } from './strategies/external-providers/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthController } from './auth.controller';
import { mainConfig } from '../config/main.config';
import { mailsConfig } from '../config/mails.config';
import { authConfig } from '../config/auth.config';
import { clientConfig } from '../config/client.config';
import { initBootstrap } from '../initBoostrap';
import { Provider } from '@prisma/client';

describe('AuthController', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [mainConfig, authConfig, mailsConfig, clientConfig],
        }),
        UsersModule,
        PassportModule.register({ session: true }),
        JwtModule.registerAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => ({
            secret: configService.get('auth.jwt.secret'),
            signOptions: { expiresIn: configService.get('auth.jwt.maxAge') },
          }),
          inject: [ConfigService],
        }),
        MailsModule,
      ],
      providers: [AuthService, LocalStrategy, GoogleStrategy, JwtStrategy],
      controllers: [AuthController],
    }).compile();

    app = moduleFixture.createNestApplication();
    initBootstrap(app);
    await app.init();
  });

  describe(Provider.email, () => {
    const emailUser = {
      email: 'email_test@example.org',
      password: 'email_test',
      firstName: 'email_test_firstName',
      lastName: 'email_test_lastName'
    };
  
    it('/register (POST)', async () => {
      return await request(app.getHttpServer())
        .post('/auth/register')
        .send(emailUser)
        .expect(201);
    });
  
    describe('authN', () => {

      it('Unauthorized before login', () => {
        return request(app.getHttpServer())
          .get('/auth/')
          .expect(401);
      })

      it('Login', () => {
        return request(app.getHttpServer())
          .get(`/auth/login?email=${emailUser.email}&password=${emailUser.password}`)
          .expect(302);
      })

      it('Authorized after login', async (done) => {
        await request(app.getHttpServer())
          .get('/auth/')
          .expect(200);
        done();
      })

      it('Logout', async (done) => {
        await request(app.getHttpServer())
          .delete('/auth/')
          .expect(200);
        done();
      })

      it('Unauthorized after logout', async (done) => {
        await request(app.getHttpServer())
          .get('/auth/')
          .expect(401);
        done();
      })
    })

    
  
    
  })

  // TODO: Auth Google

  afterAll(async () => {
    await app.close();
  });
});
