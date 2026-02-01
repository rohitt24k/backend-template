/**
 * Token Expiry Constants in  milliseconds
 */
export const TOKEN_EXPIRY = {
  EMAIL_VERIFICATION: 24 * 60 * 60 * 1000, // 24 hours
  PASSWORD_RESET: 15 * 60 * 1000, // 15 minutes
  INVITE: 7 * 24 * 60 * 60 * 1000, // 7 days
  ACCESS_TOKEN: 15 * 60 * 1000, // 15 minutes
  REFRESH_TOKEN: 7 * 24 * 60 * 60 * 1000, // 7 days
} as const;
