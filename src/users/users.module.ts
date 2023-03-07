import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UserSerializer } from './user.serializer';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UserSerializer],
  imports: [PrismaModule],
  exports: [UsersService, UserSerializer],
})
export class UsersModule {}
