import { User as UserModel } from '@prisma/client';

declare global {
  namespace Express {
    type User = UserModel;
  }
}
