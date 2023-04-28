import { ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { Socket } from 'socket.io';

@Injectable()
export class AuthenticatedGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext) {
    let req: Request;
    if (context.getType() === 'http')
      req = context.switchToHttp().getRequest<Request>();
    else if (context.getType() === 'ws')
      req = context.switchToWs().getClient<Socket>().request as Request;
    if (!req.isAuthenticated()) {
      const result = (await super.canActivate(context)) as boolean;
      await super.logIn(req);
      return result;
    }
    return true;
  }
}
