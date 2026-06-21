export const UserRoleEnum = {
  USER: "USER",
  ADMIN: "ADMIN",
} as const;

export type UserRole = (typeof UserRoleEnum)[keyof typeof UserRoleEnum];
