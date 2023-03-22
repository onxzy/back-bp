import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from './role.decorator';
import { Request } from 'express';

@Injectable()
export class RolesOrSelfGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user, params } = context.switchToHttp().getRequest<Request>();
    if (requiredRoles.some((role) => user.roles?.includes(role))) return true;

    if (!params.id) throw new BadRequestException();
    return params.id == user.id;
  }
}
