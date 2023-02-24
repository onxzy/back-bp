import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { User } from '@prisma/client';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class UserSerializer extends PassportSerializer {
  constructor(private readonly usersService: UsersService) {
    super();
  }

  serializeUser(user: User, done: (err: any, id: string) => void) {
    done(null, user.id);
  }

  async deserializeUser(id: string, done: (err: any, user: User) => void) {
    const user = await this.usersService.findUnique({ id });

    if (!user) {
      return done(
        `Could not deserialize user: user with id ${id} could not be found`,
        null,
      );
    }

    done(null, user);
  }
}
