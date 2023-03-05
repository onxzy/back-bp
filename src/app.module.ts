import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { mainConfig } from './config/main.config';
import { authConfig } from './config/auth.config';
import { swaggerConfig } from './config/swagger.config';
import { mailsConfig } from './config/mails.config';
import { clientConfig } from './config/client.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [mainConfig, authConfig, swaggerConfig, mailsConfig, clientConfig],
    }),
    UsersModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
