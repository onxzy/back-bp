import { Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { UserSerializer } from '../../users/user.serializer';
import { AuthJwt } from '../dto/auth.jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private userSerializer: UserSerializer,
  ) {
    super({
      jwtFromRequest: (req: Request) =>
        req.cookies[configService.get('auth.jwt.cookieName')],
      ignoreExpiration: false,
      secretOrKey: configService.get('auth.jwt.secret'),
    });
  }

  validate(jwt: AuthJwt) {
    return this.userSerializer.deserializeUser(jwt.userId, () => null);
  }
}
