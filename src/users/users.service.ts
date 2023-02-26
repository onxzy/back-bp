import {
  ConflictException,
  GoneException,
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, TokenType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private configService: ConfigService,
  ) {}

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

  async createUserToken(userId: string, type: TokenType) {
    const expiration = new Date();
    expiration.setSeconds(
      expiration.getSeconds() +
        this.configService.get('auth.verificationTokenExpiration'),
    );

    try {
      const token = await this.prisma.user_Tokens.create({
        data: { userId, expiration, type },
      });
      return { expiration, token };
    } catch (error) {
      if (error.code == 'P2002')
        throw new ConflictException(
          'A token of this type for this user already exists',
        );
      throw error;
    }
  }

  async verifyUser(tokenId: string) {
    const token = await this.checkUserToken(tokenId, TokenType.verification);
    if (token.user.isVerified)
      throw new ConflictException('User is already verified');

    await this.prisma.user.update({
      where: { id: token.userId },
      data: { isVerified: true },
    });
  }

  async checkUserToken(id: string, type: TokenType) {
    const token = await this.prisma.user_Tokens.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!token) throw new NotFoundException();
    if (token.type != type) throw new NotAcceptableException('Bad token type');

    this.prisma.user_Tokens.delete({ where: { id } });

    const expiration = new Date(token.expiration);
    if (expiration < new Date()) throw new GoneException('Token expired');

    return token;
  }

  async recoverPassword(tokenId: string, email: string, password: string) {
    const token = await this.checkUserToken(tokenId, TokenType.passwordReset);
    if (token.user.email != email)
      throw new NotAcceptableException('Token and email not matching');

    await this.prisma.user.update({
      where: { id: token.userId },
      data: { password },
    });
  }
}
