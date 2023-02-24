import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Req,
  Session,
  UseGuards,
} from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.input';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { LoginUserDto } from './dto/login-user.input';
import { AuthenticatedGuard } from './guards/authenticated.guard';
import { Request } from 'express';
import { Session as ExpressSession } from 'express-session';
import { UserDto } from 'src/users/dto/user';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() data: RegisterUserDto) {
    return this.authService.register(data);
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @ApiBody({ type: LoginUserDto })
  @ApiCreatedResponse({ type: UserDto })
  login(@Req() req: Request): UserDto {
    return {
      id: req.user.id,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      isVerified: req.user.isVerified,
      roles: req.user.roles,
    };
  }

  @Get()
  @UseGuards(AuthenticatedGuard)
  @ApiOkResponse({ type: UserDto })
  getUser(@Req() req: Request): UserDto {
    return {
      id: req.user.id,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      isVerified: req.user.isVerified,
      roles: req.user.roles,
    };
  }

  @Delete()
  logout(@Session() session: ExpressSession) {
    session.destroy((err) => {
      throw err;
    });
  }
}
