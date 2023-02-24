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

  async sendMail(to: string, msg: MailTemplateReady) {
    const infos = await this.mailTransporter.sendMail({ to, ...msg });
    return infos.messageId as boolean;
  }
}
