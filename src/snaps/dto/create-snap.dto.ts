export class CreateSnapDto {
  description: string;
  _userId: string;
  location:
    | string
    | {
        type: 'Point';
        coordinates: [number, number];
      };
  snaps: string[];
}
