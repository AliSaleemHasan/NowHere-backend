export const UsersPatterns = {
  GET_SETTINGS: 'users.getSettings',
  CREATE_USER_INFO: 'users.createUserInfo',
  GET_ALL_USERS_INFO: 'users.getAllUsersInfo',
  GET_USER_BY_ID: 'users.getUserById',
  GET_USER_BY_EMAIL: 'users.getUserByEmail',
  SET_USER_PHOTO: 'users.setUserPhoto',
  SET_SEEN_SNAP: 'users.setSeenSnap',
  NOT_SEEN_SNAPS: 'users.notSeenSnaps',
} as const;
