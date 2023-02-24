import { ApiPropertyOptional } from '@nestjs/swagger';
import { Provider, Role } from '@prisma/client';
import { IsEmail, IsIn, IsOptional, IsString, Length } from 'class-validator';

export class FindUsersDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 100)
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 100)
  lastName?: string;

  @ApiPropertyOptional({ enum: Role, isArray: true })
  @IsOptional()
  @IsIn(Object.values(Role))
  roles?: Role[];

  @ApiPropertyOptional({ enum: Provider })
  @IsOptional()
  @IsIn(Object.values(Provider))
  provider?: Provider;
}
