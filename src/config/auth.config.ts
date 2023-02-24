import { registerAs } from '@nestjs/config';

export const authConfig = registerAs('auth', () => ({
  google: {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.API_URL}/auth/google`,
    scope: ['email', 'profile'],
  },
}));
