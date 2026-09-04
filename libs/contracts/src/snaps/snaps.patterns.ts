export const SnapsPatterns = {
  FIND_NEAR: 'snaps.findNear',
  FIND_SEEN: 'snaps.findSeen',
  FIND_ONE: 'snaps.findOne',
  FIND_ALL: 'snaps.findAll',
  FIND_BY_TAGS: 'snaps.findByTags',
  FIND_BY_USER: 'snaps.findByUser',
  CREATE: 'snaps.create',
  DELETE_ONE: 'snaps.deleteOne',
  DELETE_ALL: 'snaps.deleteAll',
  DELETE_BY_USER_ID: 'snaps.deleteByUserId',
  MARK_FOUND: 'snaps.markFound',
  REOPEN: 'snaps.reopen',
} as const;
