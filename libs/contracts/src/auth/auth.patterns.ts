export const AuthPatterns = {
  VALIDATE_USER: 'auth.validateUser',
  SIGNUP: 'auth.signup',
  REFRESH_TOKEN: 'auth.refreshToken',
  CHANGE_PASSWORD: 'auth.changePassword',
  FORGOT_PASSWORD: 'auth.forgotPassword',
  RESET_PASSWORD: 'auth.resetPassword',
  DELETE_CREDENTIALS: 'auth.deleteCredentials',
  DEACTIVATE_USER: 'auth.deactivateUser',
} as const;
