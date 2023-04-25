import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  Session,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.input';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { LoginUserDto } from './dto/login-user.input';
import { AuthenticatedGuard } from './guards/authenticated.guard';
import { Request, Response } from 'express';
import { Session as ExpressSession } from 'express-session';
import { UserDto } from '../users/dto/user';
import { GoogleAuthGuard } from './guards/external-providers/google-auth.guard';
import { RecoverPasswordDto } from './dto/recover-password.input';
import { ConfigService } from '@nestjs/config';
import { Provider } from '@prisma/client';
import { RedirectInternalServerError } from './filters/redirect-500.filter';
import { RedirectUnauthorizedExternal } from './filters/redirect-401-external.filter';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  register(@Body() data: RegisterUserDto) {
    return this.authService.register(data);
  }

  @Get('login')
  @UseGuards(LocalAuthGuard)
  @ApiQuery({ type: LoginUserDto })
  @ApiOkResponse({ type: UserDto })
  login(@Res() res: Response, @Query('stay') stay = false) {
    res.redirect(`/auth?stay=${stay}`);
  }

  @Get('google')
  @UseFilters(RedirectUnauthorizedExternal, RedirectInternalServerError)
  @UseGuards(GoogleAuthGuard)
  @ApiOkResponse({ type: UserDto })
  googleAuth(@Req() req: Request, @Res() res: Response) {
    const jwtCookie = this.authService.getJwtCookie(req.user.id);
    res.cookie(jwtCookie.name, jwtCookie.payload, jwtCookie.options);
    res.redirect(
      `${this.configService.get(
        'client.auth.externalProviderRedirect.path',
      )}?${this.configService.get(
        'client.auth.externalProviderRedirect.parameters.provider',
      )}=${Provider.google}&${this.configService.get(
        'client.auth.externalProviderRedirect.parameters.status',
      )}=${HttpStatus.OK}&${this.configService.get(
        'client.auth.externalProviderRedirect.parameters.userId',
      )}=${req.user.id}`,
    );
  }

  @Get()
  @UseGuards(AuthenticatedGuard)
  @ApiOkResponse({ type: UserDto })
  getUser(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Query('stay') stay?: boolean,
  ): UserDto {
    if (stay) {
      const jwtCookie = this.authService.getJwtCookie(req.user.id);
      res.cookie(jwtCookie.name, jwtCookie.payload, jwtCookie.options);
    }
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
  logout(
    @Session() session: ExpressSession,
    @Res({ passthrough: true }) res: Response,
  ) {
    session.destroy(() => null);
    const jwtCookie = this.authService.getJwtCookie();
    res.cookie(jwtCookie.name, '', {
      ...jwtCookie.options,
      maxAge: 0,
    });
  }

  @Post('/verify/email')
  @UseGuards(AuthenticatedGuard)
  verifyEmail(@Req() req: Request) {
    return this.authService.initVerification(req.user);
  }

  @Patch('/verify/:token')
  verifyUser(@Param('token') id: string) {
    return this.authService.verification(id);
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

  @Delete('/leave/:id')
  @UseGuards(AuthenticatedGuard)
  async leave(
    @Param('id') id: string,
    @Req() req: Request,
    @Session() session: ExpressSession,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.leave(id, req.user);

    session.destroy(() => null);
    const jwtCookie = this.authService.getJwtCookie();
    res.cookie(jwtCookie.name, '', {
      ...jwtCookie.options,
      maxAge: 0,
    });
  }
}
