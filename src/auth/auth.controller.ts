import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Redirect,
  Req,
  Session,
  UseGuards,
} from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.input';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { LoginUserDto } from './dto/login-user.input';
import { AuthenticatedGuard } from './guards/authenticated.guard';
import { Request } from 'express';
import { Session as ExpressSession } from 'express-session';
import { UserDto } from 'src/users/dto/user';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { RecoverPasswordDto } from './dto/recover-password.input';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() data: RegisterUserDto) {
    return this.authService.register(data);
  }

  @Get('login')
  @UseGuards(LocalAuthGuard)
  @ApiQuery({ type: LoginUserDto })
  @ApiCreatedResponse({ type: UserDto })
  @Redirect('/auth')
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  login() {}

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOkResponse({ type: UserDto })
  @Redirect('/auth') // TODO: Replace with client redirection
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  googleAuth() {}

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
      provider: req.user.provider,
    };
  }

  @Delete()
  logout(@Session() session: ExpressSession) {
    session.destroy((err) => {
      throw err;
    });
  }

  @Post('/verify/email')
  @UseGuards(AuthenticatedGuard)
  verifyEmail(@Req() req: Request) {
    return this.authService.initVerification(req.user);
  }

  @Get('/verify/:token')
  async verifyUser(@Param('token') id: string) {
    await this.authService.verification(id);
    return 'Verified !'; // TODO: Replace with client redirection
  }

  @Post('/recover/:email')
  initRecoverPassword(@Param('email') email: string) {
    return this.authService.initRecoverPassword(email);
  }

  @Patch('/password/:token')
  recoverPassword(
    @Param('token') id: string,
    @Body() data: RecoverPasswordDto,
  ) {
    return this.authService.recoverPassword(id, data.email, data.password);
  }
}
