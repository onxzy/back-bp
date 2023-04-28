import { Injectable } from '@nestjs/common';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import { Server, Socket } from 'socket.io';
import * as passport from 'passport';
import { User } from '@prisma/client';
import { AppSession } from '../session';

export interface UserSocket extends Socket {
  userId?: string;
  user?: User;
}

@Injectable()
export class SocketService {
  private wrapMiddleware =
    (middleware: RequestHandler) => (socket: UserSocket, next: NextFunction) =>
      middleware(socket.request as Request, {} as Response, next);

  initMiddlewares(server: Server, gateway = '') {
    server.use(this.wrapMiddleware(AppSession.get()));
    server.use(this.wrapMiddleware(passport.initialize()));
    server.use(this.wrapMiddleware(passport.session()));
    server.use((socket: UserSocket, next) => {
      const req = socket.request as Request;
      socket.user = req.user;
      socket.userId = req.user ? socket.user.id : null;
      next();
    });
    console.info(`[Socket | ${gateway}] Middlewares initied`);
  }
}
