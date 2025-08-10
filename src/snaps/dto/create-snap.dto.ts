export class CreateSnapDto {
  description: string;
  _userId?: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  snaps: string[];
}
