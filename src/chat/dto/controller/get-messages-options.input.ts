import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class GetMessagesOptionsDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Transform((v) => parseInt(v.value))
  cursor?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Transform((v) => parseInt(v.value))
  number?: number;
}
