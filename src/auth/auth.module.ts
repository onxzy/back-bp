import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './strategies/local.strategy';
import { UserSerializer } from './strategies/user.serializer';
import { GoogleStrategy } from './strategies/google.strategy';
import { MailsModule } from 'src/mails/mails.module';

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ session: true }),
    MailsModule,
  ],
  providers: [AuthService, UserSerializer, LocalStrategy, GoogleStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
