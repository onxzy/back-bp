import { ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AuthenticatedGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    if (!req.isAuthenticated()) {
      const result = (await super.canActivate(context)) as boolean;
      await super.logIn(req);
      return result;
    }
    return true;
  }
}
