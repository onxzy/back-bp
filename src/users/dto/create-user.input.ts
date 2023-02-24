import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsEmail, IsIn, IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateUserDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  password: string;

  @ApiProperty()
  @IsString()
  @Length(2, 100)
  firstName: string;

  @ApiProperty()
  @IsString()
  @Length(2, 100)
  lastName: string;

  @ApiProperty({ enum: Role, isArray: true })
  @IsIn(Object.values(Role))
  roles: Role[];
}
