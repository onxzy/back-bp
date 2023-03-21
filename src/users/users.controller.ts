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
  Req,
  Put,
  Res,
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
import { Request, Response } from 'express';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ======================================================
  // ANO
  // ======================================================

  @Get(':id/avatar')
  getAvatar(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.redirect(this.usersService.avatar(id).get());
  }

  // ======================================================
  // USER
  // ======================================================

  @Put('avatar')
  @UseGuards(AuthenticatedGuard)
  async putAvatar(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const signedUrl = await this.usersService.avatar(req.user.id).put();
    res.redirect(signedUrl);
    console.log(signedUrl);
  }

  @Delete('avatar')
  @UseGuards(AuthenticatedGuard)
  deleteAvatar(@Req() req: Request) {
    return this.usersService.avatar(req.user.id).delete();
  }

  // ======================================================
  // ADMIN
  // ======================================================

  @Post()
  @Roles(Role.ADMIN)
  @UseGuards(AuthenticatedGuard, RolesGuard)
  admin_create(@Body() data: CreateUserDto) {
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
  admin_findAll(@Query() query: FindUsersDto) {
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
  async admin_findOneById(@Param('id') id: string) {
    const user = await this.usersService.findUnique({ id });
    if (!user) throw new NotFoundException();
    return user;
  }

  @Get('email/:email')
  @Roles(Role.ADMIN)
  @UseGuards(AuthenticatedGuard, RolesGuard)
  async admin_findOneByEmail(@Param('email') email: string) {
    const user = await this.usersService.findUnique({ email });
    if (!user) throw new NotFoundException();
    return user;
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @UseGuards(AuthenticatedGuard, RolesGuard)
  async admin_update(@Param('id') id: string, @Body() data: UpdateUserDto) {
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
  async admin_remove(@Param('id') id: string) {
    try {
      return await this.usersService.delete(id);
    } catch (error) {
      if (error.code == 'P2025') throw new NotFoundException();
      throw error;
    }
  }

  @Put(':id/avatar')
  @Roles(Role.ADMIN)
  @UseGuards(AuthenticatedGuard, RolesGuard)
  async admin_putAvatar(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.redirect(await this.usersService.avatar(id).put());
  }

  @Delete(':id/avatar')
  @Roles(Role.ADMIN)
  @UseGuards(AuthenticatedGuard, RolesGuard)
  admin_deleteAvatar(@Param('id') id: string) {
    return this.usersService.avatar(id).delete();
  }
}
