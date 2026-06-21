import { RequestHandler } from "express";
import { GenerateResponse } from "../utils/response.creator";
import * as authService from "../services/auth.service";
import { AuthError } from "../errors";
import {
  RegisterSchemaDto,
  LoginSchemaDto,
  VerifyEmailSchemaDto,
  RefreshTokenSchemaDto,
} from "../dto/auth.dto";

export const AuthController = {
  Register: (async (req, res, next) => {
    try {
      const body = res.locals.body as RegisterSchemaDto;
      const result = await authService.registerUser(body);
      GenerateResponse(res, 201, result, result.message);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,

  VerifyEmail: (async (req, res, next) => {
    try {
      const body = res.locals.body as VerifyEmailSchemaDto;
      const result = await authService.verifyEmail(body.token);
      GenerateResponse(res, 200, result, result.message);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,

  Login: (async (req, res, next) => {
    try {
      const body = res.locals.body as LoginSchemaDto;
      const ipAddress =
        (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;
      const userAgent = req.headers["user-agent"];
      const deviceFingerprint = req.headers["x-device-fingerprint"] as string;

      const result = await authService.login({
        ...body,
        ipAddress,
        userAgent,
        deviceFingerprint,
      });
      GenerateResponse(res, 200, result, "Login successful");
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,

  RefreshToken: (async (req, res, next) => {
    try {
      const body = res.locals.body as RefreshTokenSchemaDto;
      const result = await authService.refreshAccessToken(body.refreshToken);
      GenerateResponse(res, 200, result, "Access token refreshed successfully");
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,

  Logout: (async (req, res, next) => {
    try {
      const { sessionId } = res.locals.user as { userId: string; sessionId: string };

      if (!sessionId) {
        throw new AuthError("Session not found");
      }

      const result = await authService.logout(sessionId);
      GenerateResponse(res, 200, result, result.message);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,
};
