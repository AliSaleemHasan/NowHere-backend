import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt } from 'class-validator';
import {
  MAX_DISTANCE_VALUES,
  NEW_SNAP_DISTANCE_VALUES,
  SNAP_DISAPPEAR_TIME_VALUES,
} from 'contracts';

export class UpdateSettingsDto {
  @ApiProperty({ enum: MAX_DISTANCE_VALUES, example: 5000 })
  @IsInt()
  @IsIn(MAX_DISTANCE_VALUES)
  maxDistance: number;

  @ApiProperty({ enum: NEW_SNAP_DISTANCE_VALUES, example: 500 })
  @IsInt()
  @IsIn(NEW_SNAP_DISTANCE_VALUES)
  newSnapDistance: number;

  @ApiProperty({ enum: SNAP_DISAPPEAR_TIME_VALUES, example: 3 })
  @IsInt()
  @IsIn(SNAP_DISAPPEAR_TIME_VALUES)
  snapDisappearTime: number;
}
