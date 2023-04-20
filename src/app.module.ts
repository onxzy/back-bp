import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { mainConfig } from './config/main.config';
import { authConfig } from './config/auth.config';
import { swaggerConfig } from './config/swagger.config';
import { mailsConfig } from './config/mails.config';
import { clientConfig } from './config/client.config';
import { storageConfig } from './config/storage.config';
import { StorageModule } from './storage/storage.module';
import { SocketModule } from './socket/socket.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { socketConfig } from './config/socket.config';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'client'),
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        mainConfig,
        authConfig,
        swaggerConfig,
        mailsConfig,
        clientConfig,
        storageConfig,
        socketConfig,
      ],
    }),
    UsersModule,
    AuthModule,
    StorageModule,
    SocketModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
