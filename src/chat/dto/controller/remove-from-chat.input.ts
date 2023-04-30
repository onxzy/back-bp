import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class RemoveFromChatDto {
  @ApiProperty()
  @IsUUID(4, { each: true })
  membersToRemove: string[];
}
