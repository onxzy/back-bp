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
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import { Roles } from '../auth/guards/role.decorator';
import { RolesGuard } from '../auth/guards/role.guard';
import { FindUsersDto } from './dto/find-users.input';
import { UserDto } from './dto/user';
import { UpdateUserDto } from './dto/update-user.input';

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

  @Get(':id')
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

  @Patch(':id')
  @Roles(Role.ADMIN)
  @UseGuards(AuthenticatedGuard, RolesGuard)
  async update(@Param('id') id: string, @Body() data: UpdateUserDto) {
    try {
      return await this.usersService.update({ id }, data);
    } catch (error) {
      if (error.code == 'P2025') throw new NotFoundException();
      throw error;
    }
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @UseGuards(AuthenticatedGuard, RolesGuard)
  async remove(@Param('id') id: string) {
    try {
      return await this.usersService.delete(id);
    } catch (error) {
      if (error.code == 'P2025') throw new NotFoundException();
      throw error;
    }
  }
}
