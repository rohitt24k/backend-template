import z from "zod";
import { T_MongoDoc } from "../types/common.types";
import {
  RegisterSchema,
  LoginSchema,
  VerifyEmailSchema,
  RefreshTokenSchema,
} from "../schemas/auth.schema";
import { UserRole } from "../constants/roles";

export type RegisterSchemaDto = z.infer<typeof RegisterSchema>;
export type LoginSchemaDto = z.infer<typeof LoginSchema>;
export type VerifyEmailSchemaDto = z.infer<typeof VerifyEmailSchema>;
export type RefreshTokenSchemaDto = z.infer<typeof RefreshTokenSchema>;

export type UserDto = {
  name: string;
  email: string;
  passwordHash: string;
  isEmailVerified: boolean;
  role: UserRole;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";
  lastLoginAt?: Date;
} & T_MongoDoc;

export type UserSessionDto = {
  userId: string;
  sessionTokenHash?: string;
  refreshTokenHash?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
  isActive: boolean;
  revokedAt?: Date;
  expiresAt: Date;
  lastActivity?: Date;
} & T_MongoDoc;

export type TokenDto = {
  token: string;
  userId: string;
  type: "EMAIL_VERIFICATION" | "PASSWORD_RESET" | "LOGIN";
  expiresAt: Date;
} & T_MongoDoc;
