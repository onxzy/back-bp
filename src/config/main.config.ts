import { CorsOptions } from 'cors';
import { SessionOptions } from 'express-session';

export const mainConfig = () => {
  const port = parseInt(process.env.PORT, 10) || 3000;
  return {
    port,
    apiUrl: process.env.API_URL || `http://localhost:${port}`,
    session: {
      // FIXME: Session store
      name: process.env.SESSION_COOKIE_NAME || 'connect.sid',
      secret: process.env.SESSION_SECRET || 'session-secret',
      resave: false,
      saveUninitialized: false,
    } as SessionOptions,
    cors: {
      origin: '*',
      credentials: true,
      exposedHeaders: ['Content-Type', 'Authorization'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    } as CorsOptions
  } as const;
};

export type mainConfig = ReturnType<typeof mainConfig>;
