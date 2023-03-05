import { registerAs } from '@nestjs/config';

export const clientConfig = registerAs('client', () => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:8080';
  return {
    clientUrl,
    auth: {
      verify: {
        path: `${clientUrl}/auth/verify`,
        parameter: 'token',
      },
      recoverPassword: {
        path: `${clientUrl}/auth/recover`,
        parameter: 'token',
      },
      externalProviderRedirect: {
        path: `${clientUrl}/auth/external`,
        parameters: {
          provider: 'provider',
          status: 'status',
          userId: 'user',
        },
      },
      serverError: {
        path: `${clientUrl}/auth/error`,
      },
    },
  };
});
