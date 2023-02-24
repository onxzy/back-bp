import { registerAs } from '@nestjs/config';

export const swaggerConfig = registerAs('swagger', () => ({
  title: 'Back BP',
  description: 'Backend Boilerplate',
  version: '0.1',
  swaggerPath: 'doc',
}));
