import { type Request, type Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { GenerateResponse } from "../utils/generateResponse";
import * as authService from "../services/auth.service";
import { AuthError } from "../errors";

export const Register = asyncHandler(async (req: Request, res: Response) => {
  const { email, name, password } = req.body;

  const result = await authService.registerUser({ email, name, password });

  return GenerateResponse(res, 201, result, result.message);
});

export const VerifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;

  const result = await authService.verifyEmail(token);

  return GenerateResponse(res, 200, result, result.message);
});

export const Login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const ipAddress =
    (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;
  const userAgent = req.headers["user-agent"];
  const deviceFingerprint = req.headers["x-device-fingerprint"] as string;

  const result = await authService.login({
    email,
    password,
    ipAddress,
    userAgent,
    deviceFingerprint,
  });

  return GenerateResponse(res, 200, result, "Login successful");
});

export const RefreshToken = asyncHandler(
  async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    const result = await authService.refreshAccessToken(refreshToken);

    return GenerateResponse(
      res,
      200,
      result,
      "Access token refreshed successfully",
    );
  },
);

export const Logout = asyncHandler(async (req: Request, res: Response) => {
  const sessionId = req.user?.sessionId;

  if (!sessionId) {
    throw new AuthError("Session not found");
  }

  const result = await authService.logout(sessionId);

  return GenerateResponse(res, 200, result, result.message);
});
