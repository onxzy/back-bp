import { ApiProperty } from '@nestjs/swagger';
import { Provider, Role } from '@prisma/client';

export class UserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  isVerified: boolean;

  @ApiProperty({ enum: Role, isArray: true })
  roles: Role[];

  @ApiProperty({ enum: Provider })
  provider: Provider;
}
