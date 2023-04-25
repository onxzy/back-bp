import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as expressSession from 'express-session';
import * as passport from 'passport';
import * as cookieParser from 'cookie-parser';
import * as cors from 'cors';
import { mainConfig } from './config/main.config';
import { Server } from 'socket.io';
import { SocketService } from './socket/socket.service';

export function initBootstrap(app: INestApplication) {
  const configService = app.get(ConfigService);
  const socketService = app.get(SocketService);

  app.useGlobalPipes(
    new ValidationPipe({
      disableErrorMessages: false,
      whitelist: true,
      transform: true,
    }),
  );

  app.use(cookieParser());

  const session = expressSession(
    configService.get<mainConfig['session']>('session'),
  );
  app.use(session);

  app.use(passport.initialize());
  app.use(passport.session());

  app.use(cors(configService.get<mainConfig['cors']>('cors')));

  const io = new Server(
    app.getHttpServer(),
    configService.get<mainConfig['socketIo']>('socketIo'),
  );
  socketService.init(io, session);
}
