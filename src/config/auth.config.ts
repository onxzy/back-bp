import { registerAs } from '@nestjs/config';

export const authConfig_shared = {
  avatar: {
    bucket: 'avatar',
    public: true,
  },
} as const;

export const authConfig = registerAs(
  'auth',
  () =>
    ({
      jwt: {
        secret: process.env.JWT_SECRET || '9kEaatiqkBsQiaJdopF2BubZ69FYtg2T',
        cookieName: 'auth.jwt',
        maxAge: 30 * 24 * 60 * 60, // In seconds
        path: '/',
      },
      userToken: {
        // Expiration in seconds
        defaultExpiration: 24 * 60 * 60,
        verifyExpiration: 24 * 60 * 60,
        recoverExpiration: 10 * 60,
        removeExpiredCron: '0 * * * *',
      },
      google: {
        enable: Boolean(process.env.GOOGLE_CLIENT_ID),
        clientID: process.env.GOOGLE_CLIENT_ID || 'disabled',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.API_URL}/auth/google`,
        scope: ['email', 'profile'],
      },
      ...authConfig_shared,
    } as const),
);

export type authConfig = ReturnType<typeof authConfig>;
