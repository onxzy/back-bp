import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AddToChatDto {
  @ApiProperty()
  @IsUUID(4, { each: true })
  membersToAdd: string[];
}
