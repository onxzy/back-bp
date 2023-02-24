import { ConflictException, Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { UsersService } from 'src/users/users.service';
import { RegisterUserDto } from './dto/register-user.input';
import { compareSync, hashSync } from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async register(data: RegisterUserDto) {
    const passwordHash = hashSync(data.password, 10);
    try {
      const user = await this.usersService.create({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        password: passwordHash,
      });
      return user;
    } catch (error) {
      if (error.code == 'P2002') throw new ConflictException();
      throw error;
    }
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findUnique({ email }, true);
    if (!user) return null;
    if (!compareSync(password, user.password)) return null;
    return user;
  }
}
