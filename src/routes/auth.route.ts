import { Router } from "express";
import { AuthenticationMiddleware } from "../middlewares/authentication.middleware";
import { zodMiddleware } from "../middlewares/zod.middleware";
import { AuthController } from "../controllers/auth.controller";
import {
  RegisterSchema,
  LoginSchema,
  VerifyEmailSchema,
  RefreshTokenSchema,
} from "../schemas/auth.schema";

export const AuthRouter = Router();

// Public: register new user
AuthRouter.post(
  "/register",
  zodMiddleware({ body: RegisterSchema }),
  AuthController.Register,
);

// Public: verify email with token
AuthRouter.post(
  "/verify-email",
  zodMiddleware({ body: VerifyEmailSchema }),
  AuthController.VerifyEmail,
);

// Public: login
AuthRouter.post(
  "/login",
  zodMiddleware({ body: LoginSchema }),
  AuthController.Login,
);

// Public: refresh access token
AuthRouter.post(
  "/refresh-token",
  zodMiddleware({ body: RefreshTokenSchema }),
  AuthController.RefreshToken,
);

// Authenticated: logout
AuthRouter.post("/logout", AuthenticationMiddleware, AuthController.Logout);
