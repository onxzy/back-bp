import { RequestHandler, Request, Response, NextFunction } from 'express';
import * as expressSession from 'express-session';
import { config as sessionConfig } from './config/session.config';
export class AppSession {
  private static _sessionInstance: RequestHandler;

  static init() {
    if (AppSession._sessionInstance) return;
    AppSession._sessionInstance = expressSession(sessionConfig);
    console.info('[Session] Initied');
  }

  static get(): RequestHandler {
    AppSession.init();
    return (req: Request, res: Response, next: NextFunction) => {
      if (!AppSession._sessionInstance) throw new Error('Session not initied');
      return AppSession._sessionInstance(req, res, next);
    };
  }
}
