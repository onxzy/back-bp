import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Catch(InternalServerErrorException)
export class RedirectInternalServerError implements ExceptionFilter {
  constructor(private readonly configService: ConfigService) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    host
      .switchToHttp()
      .getResponse<Response>()
      .redirect(`${this.configService.get('client.auth.serverError.path')}`);
  }
}
