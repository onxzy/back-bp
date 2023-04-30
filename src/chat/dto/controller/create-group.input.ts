import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateGroupDto {
  @ApiProperty()
  @IsUUID(4, { each: true })
  newMembers: string[];
}
