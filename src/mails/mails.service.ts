import { Injectable } from '@nestjs/common';
import { Transporter, createTransport } from 'nodemailer';
import { MailTemplateReady } from './templates/templates';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailsService {
  mailTransporter: Transporter;

  constructor(configService: ConfigService) {
    const config = configService.get('mails');
    if (config.host) {
      this.mailTransporter = createTransport(configService.get('mails'));

      // Check connection
      this.mailTransporter.verify((err, _) => {
        if (err) throw err
        else console.info('[Mails Service] SMTP server online !');
      })
    } else {
      this.mailTransporter = null;
      console.warn('[Mails Service] No SMTP server configured !');
    }
    
  }

  async sendMail(to: string, msg: MailTemplateReady) {
    if (this.mailTransporter) {
      const infos = await this.mailTransporter.sendMail({ to, ...msg });
      return infos.messageId as boolean;
    } else {
      console.info(`[Mails Service] No SMTP server - Mail "${msg.subject.substring(0, 31)}" to <${to}> not sent`);
      return true;
    }
  }
}
