import { ConflictException, Injectable } from '@nestjs/common';
import { Provider, User } from '@prisma/client';
import { UsersService } from 'src/users/users.service';
import { RegisterUserDto } from './dto/register-user.input';
import { compareSync, hashSync } from 'bcrypt';
import { Profile } from 'passport';
import { MailsService } from 'src/mails/mails.service';
import { welcomeTemplate } from 'src/mails/templates/auth/welcome';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private mailsService: MailsService,
  ) {}

  async register(data: RegisterUserDto) {
    const passwordHash = hashSync(data.password, 10);
    try {
      const user = await this.usersService.create({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        password: passwordHash,
      });
      this.mailsService.sendMail(data.email, welcomeTemplate(data.email));
      return user;
    } catch (error) {
      if (error.code == 'P2002') throw new ConflictException();
      throw error;
    }
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findUnique({ email }, true);
    if (!user) return null;
    if (!compareSync(password, user.password)) return null;
    return user;
  }

  async registerExternal(profile: Profile) {
    try {
      const user = await this.usersService.findOrCreate({
        email: profile.emails[0].value,
        firstName: profile.name?.givenName,
        lastName: profile.name?.familyName,
        provider: profile.provider as Provider,
        isVerified: true,
      });
      return user;
    } catch (error) {
      if (error.code == 'P2002') throw new ConflictException();
      throw error;
    }
  }
}
