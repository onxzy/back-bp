import { registerAs } from '@nestjs/config';
import { GatewayMetadata } from '@nestjs/websockets';

export const config = {
  namespaces: {
    chat: {
      gatewayMetadata: {
        namespace: 'chat',
        cors: {
          origin: '*',
          credentials: true,
        },
        transports: ['websocket'],
      } as GatewayMetadata,
    },
  },
};

export const socketConfig = registerAs('socket', () => config);
export type socketConfig = ReturnType<typeof socketConfig>;
