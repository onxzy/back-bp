import {
  ConflictException,
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { Provider, TokenType, User } from '@prisma/client';
import { UsersService } from 'src/users/users.service';
import { RegisterUserDto } from './dto/register-user.input';
import { compareSync, hashSync } from 'bcrypt';
import { Profile } from 'passport';
import { MailsService } from 'src/mails/mails.service';
import { welcomeTemplate } from 'src/mails/templates/auth/welcome';
import { accountVerificationTemplate } from 'src/mails/templates/auth/accountVerification';
import { ConfigService } from '@nestjs/config';
import { passwordResetTemplate } from 'src/mails/templates/auth/passwordReset';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private mailsService: MailsService,
    private configService: ConfigService,
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
      await this.initVerification(user);
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
      this.mailsService.sendMail(user.email, welcomeTemplate(user.firstName));
      return user;
    } catch (error) {
      if (error.code == 'P2002') throw new ConflictException();
      throw error;
    }
  }

  async initVerification(user: User) {
    if (user.provider != Provider.email)
      throw new NotAcceptableException('User provider is not email');
    if (user.isVerified)
      throw new ConflictException('User is already verified');

    const { token } = await this.usersService.createUserToken(
      user.id,
      TokenType.verification,
    );

    await this.mailsService.sendMail(
      user.email,
      accountVerificationTemplate(
        user.firstName,
        `${this.configService.get('apiUrl')}/auth/verify/${token.id}`,
      ),
    );
  }

  verification(id: string) {
    return this.usersService.verifyUser(id);
  }

  async initRecoverPassword(email: string) {
    const user = await this.usersService.findUnique({ email });
    if (!user) throw new NotFoundException();
    if (user.provider != Provider.email)
      throw new NotAcceptableException('User provider is not email');

    const { token } = await this.usersService.createUserToken(
      user.id,
      TokenType.passwordReset,
    );

    await this.mailsService.sendMail(
      user.email,
      passwordResetTemplate(
        user.firstName,
        `${this.configService.get(
          'client.auth.recoverPassword.path',
        )}?${this.configService.get('client.auth.recoverPassword.parameter')}=${
          token.id
        }`,
      ),
    );
  }

  recoverPassword(id: string, email: string, password: string) {
    return this.usersService.recoverPassword(id, email, password);
  }
}
