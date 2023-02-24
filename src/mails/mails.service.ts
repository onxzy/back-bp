import { Injectable } from '@nestjs/common';
import { Transporter, createTransport } from 'nodemailer';
import { MailTemplateReady } from './templates/templates';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailsService {
  mailTransporter: Transporter;

  constructor(configService: ConfigService) {
    this.mailTransporter = createTransport(configService.get('mails'));
  }

  sendMail(to: string, msg: MailTemplateReady) {
    return this.mailTransporter.sendMail({ to, ...msg });
  }
}
