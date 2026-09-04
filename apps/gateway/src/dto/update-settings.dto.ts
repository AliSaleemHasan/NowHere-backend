import { IsIn, IsInt } from 'class-validator';
import {
  MAX_DISTANCE_VALUES,
  NEW_SNAP_DISTANCE_VALUES,
  SNAP_DISAPPEAR_TIME_VALUES,
} from 'contracts';

export class UpdateSettingsDto {
  @IsInt()
  @IsIn(MAX_DISTANCE_VALUES)
  maxDistance: number;

  @IsInt()
  @IsIn(NEW_SNAP_DISTANCE_VALUES)
  newSnapDistance: number;

  @IsInt()
  @IsIn(SNAP_DISAPPEAR_TIME_VALUES)
  snapDisappearTime: number;
}
