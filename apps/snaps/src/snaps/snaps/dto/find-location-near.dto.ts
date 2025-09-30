import { IsNumberString } from 'class-validator';

export class FindLocationNear {
  @IsNumberString()
  lat: number;

  @IsNumberString()
  lng: number;
}
