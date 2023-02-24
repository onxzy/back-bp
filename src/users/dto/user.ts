import { ApiProperty, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

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
}
