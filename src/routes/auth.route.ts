import express from "express";
import {
  Register,
  VerifyEmail,
  Login,
  RefreshToken,
  Logout,
} from "../controllers/auth.controller";
import { authenticate } from "../middleware/authentication.middleware";
import { validate } from "../middleware/validation.middleware";
import {
  registerSchema,
  verifyEmailSchema,
  loginSchema,
  refreshTokenSchema,
} from "../validation/auth.validation";

const AuthRouter = express.Router();

AuthRouter.post("/register", validate(registerSchema), Register);
AuthRouter.post("/verify-email", validate(verifyEmailSchema), VerifyEmail);
AuthRouter.post("/login", validate(loginSchema), Login);
AuthRouter.post("/refresh-token", validate(refreshTokenSchema), RefreshToken);

AuthRouter.post("/logout", authenticate, Logout);

export { AuthRouter };
