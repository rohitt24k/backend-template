import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    email: z.email({ message: "Email is required" }).toLowerCase().trim(),
    name: z
      .string({ message: "Name is required" })
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must not exceed 100 characters")
      .trim(),
    password: z
      .string({ message: "Password is required" })
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password must not exceed 100 characters"),
  }),
});

export const verifyEmailSchema = z.object({
  body: z.object({
    token: z
      .string({ message: "Verification token is required" })
      .min(1, "Token cannot be empty"),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.email({ message: "Email is required" }).toLowerCase().trim(),
    password: z
      .string({ message: "Password is required" })
      .min(8, "Password must be at least 8 characters"),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z
      .string({ message: "Refresh token is required" })
      .min(1, "Refresh token cannot be empty"),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
