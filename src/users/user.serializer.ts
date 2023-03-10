import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { User } from '@prisma/client';
import { VerifyCallback } from 'passport-google-oauth2';
import { UsersService } from './users.service';

@Injectable()
export class UserSerializer extends PassportSerializer {
  constructor(private readonly usersService: UsersService) {
    super();
  }

  serializeUser(user: User, done: VerifyCallback) {
    done(null, user.id);
  }

  async deserializeUser(id: string, done: VerifyCallback) {
    const user = await this.usersService.findUnique({ id });

    if (!user) {
      done(
        `Could not deserialize user: user with id ${id} could not be found`,
        null,
      );
      return null;
    }

    done(null, user);
    return user;
  }
}
