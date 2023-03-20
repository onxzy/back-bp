import { User as UserModel } from '@prisma/client';

declare global {
  namespace Express {
    type User = UserModel;
  }
}

type ReturnType<T extends (...args: any[]) => any> = T extends (
  ...args: any[]
) => infer R
  ? R
  : never;
