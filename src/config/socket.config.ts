import { registerAs } from '@nestjs/config';
import { authConfig_shared } from './auth.config';

export const socketConfig = registerAs('socket', () => {
  return {
    namespaces: [
      {
        prefix: '/chat',
        auth: true,
        debug: true,
      }
    ]
  } as const;
});

export type Namespaces = socketConfig['namespaces'][number]['prefix'];
export type NamespaceConfig = {
  prefix: Namespaces;
  auth: boolean;
  debug: boolean;
  options?: object;
};
export type socketConfig = ReturnType<typeof socketConfig>;
