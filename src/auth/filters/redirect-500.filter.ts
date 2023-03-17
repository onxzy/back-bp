import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Catch()
export class RedirectInternalServerError implements ExceptionFilter {
  constructor(private readonly configService: ConfigService) {}

  catch(exception: Error, host: ArgumentsHost) {
    console.error(exception)
    host
      .switchToHttp()
      .getResponse<Response>()
      .redirect(`${this.configService.get('client.auth.serverError.path')}`);
  }
}
