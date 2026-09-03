export const MIN_DISTANCE_TO_POST =
  Number(process.env.MIN_DISTANCE_SAME_USER) || 1000; // meters
export const maxDistance_TO_SEE =
  Number(process.env.MAX_DISTANCE_NEAR || process.env.maxDistance_NEAR) || 5000; // meters
export const SNAP_DISAPPEAR_TIME =
  Number(process.env.SNAP_DISAPPEAR_TIME) || 1; // days
