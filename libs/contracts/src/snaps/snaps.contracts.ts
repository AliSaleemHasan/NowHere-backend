export const SnapsPatterns = {
  FIND_NEAR: 'snaps.findNear',
  FIND_SEEN: 'snaps.findSeen',
  FIND_ONE: 'snaps.findOne',
  FIND_ALL: 'snaps.findAll',
  FIND_BY_TAGS: 'snaps.findByTags',
  CREATE: 'snaps.create',
  DELETE_ONE: 'snaps.deleteOne',
  DELETE_ALL: 'snaps.deleteAll',
} as const;

export interface FindNearSnapsPayload {
  userId: string;
  lng: number | string;
  lat: number | string;
  tags?: string[]; // TODO: Define required tags
  maxDistance?: number;
}

export interface CreateSnapPayload {
  userId: string;
  title?: string;
  body?: string;
  tag?: string;
  tags?: string[];
  location:
    | {
        type: 'Point';
        coordinates: [number, number];
      }
    | string;
  files?: Array<{
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    buffer?: any;
    size?: number;
    filename?: string;
    path?: string;
  }>;
}
