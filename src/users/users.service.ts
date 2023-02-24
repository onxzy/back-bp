import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({ data });
  }

  findOrCreate(data: Prisma.UserCreateInput) {
    return this.prisma.user.upsert({
      where: { email: data.email },
      update: {},
      create: data,
    });
  }

  findMany(where?: Prisma.UserWhereInput) {
    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isVerified: true,
        roles: true,
        provider: true,
      },
    });
  }

  findUnique(where: Prisma.UserWhereUniqueInput, selectPassword = false) {
    return this.prisma.user.findUnique({
      where,
      select: {
        id: true,
        email: true,
        password: selectPassword,
        firstName: true,
        lastName: true,
        isVerified: true,
        roles: true,
        provider: true,
      },
    });
  }

  update(where: Prisma.UserWhereUniqueInput, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({
      data,
      where,
    });
  }

  delete(where: Prisma.UserWhereUniqueInput) {
    return this.prisma.user.delete({ where });
  }
}
