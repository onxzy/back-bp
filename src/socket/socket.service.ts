import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import { Server, Socket } from 'socket.io';
import * as passport from 'passport';
import { User } from '@prisma/client';
import { EventsMap } from 'socket.io/dist/typed-events';
import {
  NamespaceConfig,
  Namespaces,
  socketConfig,
} from '../config/socket.config';
import {
  EventMessageData,
  EventMessageDataRaw,
  eventMessageData_RawHandler,
} from './dto/message.event';

interface UserSocket extends Socket {
  request: Request;
  userId?: string;
  user?: User;
}

@Injectable()
export class SocketService {
  public nspServers = new Map<Namespaces, Server[]>();

  constructor(private configService: ConfigService) {}

  private wrapMiddleware =
    (middleware: RequestHandler) => (socket: UserSocket, next: NextFunction) =>
      middleware(socket.request, {} as Response, next);

  private _init = false;
  init(io: Server, sessionMiddleware: RequestHandler) {
    if (this._init) return;
    else this._init = true;

    for (const namespaceConfig of this.configService.get<NamespaceConfig[]>(
      'socket.namespaces',
    )) {
      const nsp = io.of(namespaceConfig.prefix);
      this.nspServers[namespaceConfig.prefix] = nsp;

      if (namespaceConfig.auth) {
        nsp.use(this.wrapMiddleware(sessionMiddleware));
        nsp.use(this.wrapMiddleware(passport.initialize()));
        nsp.use(this.wrapMiddleware(passport.session()));
        nsp.use((socket: UserSocket, next) => {
          socket.user = socket.request.user;
          socket.userId = socket.request.user ? socket.user.id : null;
          next();
        });
      }

      nsp.on('connection', (socket: UserSocket) => {
        this.initConnection(namespaceConfig.prefix, namespaceConfig, socket);
      });

      console.info(`[Socket] Namespace ${namespaceConfig.prefix} initied`);
    }
  }

  private listenEvent<dataType = string | object>(
    socket: UserSocket,
    event: string,
    callback: (data: dataType) => void,
  ): UserSocket;
  private listenEvent<dataType = string | object, rawType = string | object>(
    socket: UserSocket,
    event: string,
    callback: (data: dataType) => void,
    rawHandler: (raw: rawType) => dataType,
  ): UserSocket;
  private listenEvent<dataType = string | object, rawType = string | object>(
    socket: UserSocket,
    event: string,
    callback: (data: dataType) => void,
    rawHandler: (raw: rawType | dataType) => dataType = (raw: dataType) => raw,
  ) {
    return socket.on(event, (raw) => {
      return callback(rawHandler(raw));
    });
  }

  initConnection(
    namespace: Namespaces,
    config: NamespaceConfig,
    socket: UserSocket,
  ) {
    const socketLog = config.debug ? console.log : () => null;

    socketLog(
      `[Socket] ${socket.id} (${
        socket.user ? socket.user.email : 'ano'
      }) joined`,
    );
    this.listenEvent<string>(socket, 'disconnect', (reason) => {
      socketLog(`[Socket] ${socket.id} left (${reason})`);
    });

    if (namespace == '/chat') {
      this.listenEvent<EventMessageData, EventMessageDataRaw>(
        socket,
        'msg',
        (message) => {
          socketLog(message);
          socketLog(
            `[Socket] ${namespace}@${socket.rooms} ${socket.userId} : ${message.body.text}`,
          );
        },
        eventMessageData_RawHandler,
      );
    }
  }
}
