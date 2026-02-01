import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  JWT_REFRESH_SECRET,
  JWT_SECRET,
  SALT_ROUNDS,
} from "../config/app-config";
import { AuthError } from "../errors";
import { TOKEN_EXPIRY } from "./constants";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateAccessToken(userId: string, sessionId: string): string {
  return jwt.sign({ userId, sessionId, type: "access" }, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY.ACCESS_TOKEN,
  });
}

export function generateRefreshToken(
  userId: string,
  sessionId: string,
): string {
  return jwt.sign({ userId, sessionId, type: "refresh" }, JWT_REFRESH_SECRET, {
    expiresIn: TOKEN_EXPIRY.REFRESH_TOKEN,
  });
}

export function verifyAccessToken(token: string): {
  userId: number;
  sessionId: number;
} {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return { userId: decoded.userId, sessionId: decoded.sessionId };
  } catch (error) {
    throw new AuthError("Invalid or expired token");
  }
}

export function verifyRefreshToken(token: string): {
  userId: string;
  sessionId: string;
} {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as any;
    return { userId: decoded.userId, sessionId: decoded.sessionId };
  } catch (error) {
    throw new AuthError("Invalid or expired refresh token");
  }
}
