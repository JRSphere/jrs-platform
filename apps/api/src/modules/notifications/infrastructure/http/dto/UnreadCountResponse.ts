import { ApiProperty } from '@nestjs/swagger';

export class UnreadCountResponse {
  @ApiProperty({ type: Number })
  count!: number;
}
