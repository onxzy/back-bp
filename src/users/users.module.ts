import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UserSerializer } from './user.serializer';
import { StorageModule } from '../storage/storage.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UserSerializer],
  imports: [PrismaModule, StorageModule],
  exports: [UsersService, UserSerializer],
})
export class UsersModule {}
