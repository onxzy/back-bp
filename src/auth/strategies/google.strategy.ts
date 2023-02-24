import { Strategy, VerifyCallback } from 'passport-google-oauth2';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, NotAcceptableException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { Profile } from 'passport';
import { Provider } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService, private authService: AuthService) {
    super(configService.get('auth.google'));
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    if (profile.provider != Provider.google) throw new NotAcceptableException();
    try {
      const user = await this.authService.registerExternal(profile);
      done(null, user);
    } catch (error) {
      done(error);
    }
  }
}
