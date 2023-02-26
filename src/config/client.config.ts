import { registerAs } from '@nestjs/config';

export const clientConfig = registerAs('client', () => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:8080';
  return {
    clientUrl,
    auth: {
      recoverPassword: {
        path: `${clientUrl}/auth/recover`,
        parameter: 'token',
      },
    },
  };
});
