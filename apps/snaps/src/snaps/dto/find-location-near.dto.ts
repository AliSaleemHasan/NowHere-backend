import { Type } from 'class-transformer';
import { IsNumber, Max, Min } from 'class-validator';

export class FindLocationNear {
  @Type(() => Number)
  @IsNumber({}, { message: 'lat must be a valid number' })
  @Min(-90, { message: 'lat must be between -90 and 90' })
  @Max(90, { message: 'lat must be between -90 and 90' })
  lat: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'lng must be a valid number' })
  @Min(-180, { message: 'lng must be between -180 and 180' })
  @Max(180, { message: 'lng must be between -180 and 180' })
  lng: number;
}
