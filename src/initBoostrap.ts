import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as session from 'express-session';
import * as passport from 'passport';
import * as cookieParser from 'cookie-parser';
import * as cors from 'cors';
import { mainConfig } from './config/main.config';

export function initBootstrap(app: INestApplication) {
  const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      disableErrorMessages: false,
      whitelist: true,
      transform: true,
    }),
  );

  app.use(cookieParser());

  app.use(session(configService.get<mainConfig['session']>('session')));

  app.use(passport.initialize());
  app.use(passport.session());

  app.use(cors(configService.get<mainConfig['cors']>('cors')));
}
