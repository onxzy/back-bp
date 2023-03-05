import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Catch(UnauthorizedException)
export class RedirectUnauthorizedExternal implements ExceptionFilter {
  constructor(private readonly configService: ConfigService) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    host
      .switchToHttp()
      .getResponse<Response>()
      .redirect(
        `${this.configService.get(
          'client.auth.externalProviderRedirect.path',
        )}?${this.configService.get(
          'client.auth.externalProviderRedirect.parameters.status',
        )}=${exception.getStatus()}`,
      );
  }
}
