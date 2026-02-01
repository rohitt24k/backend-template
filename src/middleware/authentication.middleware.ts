import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthError } from "../errors";
import { validateSession } from "../services/auth.service";
import { verifyAccessToken } from "../utils/auth";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AuthError("No authentication token provided");
    }

    const token = authHeader.substring(7);

    const decoded = verifyAccessToken(token);

    const { userId, sessionId } = decoded;

    if (!userId || !sessionId) {
      throw new AuthError("Invalid token payload");
    }

    await validateSession(token, sessionId);

    req.user = { userId, sessionId };

    next();
  } catch (error) {
    next(error);
  }
}
