import { Request, Response, NextFunction } from "express";
import { AuthError } from "../errors";
import { verifyAccessToken } from "../utils/auth";
import { validateSession } from "../services/auth.service";

export async function AuthenticationMiddleware(
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

    const { userId, sessionId } = verifyAccessToken(token);

    if (!userId || !sessionId) {
      throw new AuthError("Invalid token payload");
    }

    await validateSession(token, sessionId);

    res.locals.user = { userId, sessionId };

    next();
  } catch (error) {
    next(error);
  }
}
