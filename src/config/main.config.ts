import { CorsOptions } from 'cors';

export const mainConfig = () => {
  const port = parseInt(process.env.PORT, 10) || 3000;
  return {
    port,
    apiUrl: process.env.API_URL || `http://localhost:${port}`,
    cors: {
      origin: '*',
      credentials: true,
      exposedHeaders: ['Content-Type', 'Authorization'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    } as CorsOptions,
  } as const;
};

export type mainConfig = ReturnType<typeof mainConfig>;
