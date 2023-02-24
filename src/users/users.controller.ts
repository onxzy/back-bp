import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ConflictException,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Role } from '@prisma/client';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.input';
import { AuthenticatedGuard } from 'src/auth/guards/authenticated.guard';
import { Roles } from 'src/auth/strategies/role.decorator';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { FindUsersDto } from './dto/find-users.input';
import { UserDto } from './dto/user';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.ADMIN)
  @UseGuards(AuthenticatedGuard, RolesGuard)
  create(@Body() data: CreateUserDto) {
    try {
      return this.usersService.create(data);
    } catch (error) {
      if (error.code == 'P2002') throw new ConflictException();
      throw error;
    }
  }

  @Get()
  @Roles(Role.ADMIN)
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @ApiOkResponse({ type: UserDto, isArray: true })
  findAll(@Query() query: FindUsersDto) {
    return this.usersService.findMany({
      email: query.email ? { contains: query.email } : undefined,
      firstName: query.firstName
        ? { contains: query.firstName, mode: 'insensitive' }
        : undefined,
      lastName: query.lastName
        ? { contains: query.lastName, mode: 'insensitive' }
        : undefined,
      roles: query.roles ? { hasSome: query.roles } : undefined,
    });
  }

  @Get('id/:id')
  @Roles(Role.ADMIN)
  @UseGuards(AuthenticatedGuard, RolesGuard)
  async findOneById(@Param('id') id: string) {
    const user = await this.usersService.findUnique({ id });
    if (!user) throw new NotFoundException();
    return user;
  }

  @Get('email/:email')
  @Roles(Role.ADMIN)
  @UseGuards(AuthenticatedGuard, RolesGuard)
  async findOneByEmail(@Param('email') email: string) {
    const user = await this.usersService.findUnique({ email });
    if (!user) throw new NotFoundException();
    return user;
  }

  // @Patch(':id')
  // @UseGuards(AuthenticatedGuard)
  // update(@Param('id') id: string, @Body() data: Prisma.UserUpdateInput) {
  //   return this.usersService.update({ id }, data);
  // }

  // @Delete(':id')
  // @UseGuards(AuthenticatedGuard)
  // remove(@Param('id') id: string) {
  //   return this.usersService.delete({ id });
  // }
}
