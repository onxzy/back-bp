import { registerAs } from '@nestjs/config';

export const mailsConfig = registerAs(
  'mails',
  () =>
    ({
      host: process.env.SMTP_HOST || false,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: Boolean(parseInt(process.env.SMTP_SECURE || '0')),
      auth: {
        user: process.env.SMTP_USER || 'username',
        pass: process.env.SMTP_PASSWORD || 'password',
      },
    } as const),
);

export type mailsConfig = ReturnType<typeof mailsConfig>;
