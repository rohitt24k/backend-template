import { generateToken, hashToken } from "../lib/token";
import { sendEmailVerification } from "../utils/verificationEmail";
import { TOKEN_EXPIRY } from "../utils/constants";
import { AppError, AuthError, BadRequest, Conflict, NotFoundError } from "../errors";
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/auth";
import { User } from "../models/user.model";
import { UserSession } from "../models/user-session.model";
import { Token } from "../models/token.model";
import { RegisterSchemaDto, LoginSchemaDto } from "../dto/auth.dto";

export async function registerUser(data: RegisterSchemaDto) {
  const { email, name, password } = data;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Conflict("User with this email already exists");
  }

  const passwordHash = await hashPassword(password);

  const user = await new User({
    email,
    name,
    passwordHash,
    status: "PENDING_VERIFICATION",
    isEmailVerified: false,
  }).save();

  const { rawToken, hashedToken } = generateToken();

  await new Token({
    token: hashedToken,
    userId: user._id.toString(),
    type: "EMAIL_VERIFICATION",
    expiresAt: new Date(Date.now() + TOKEN_EXPIRY.EMAIL_VERIFICATION),
  }).save();

  await sendEmailVerification({ email, token: rawToken });

  return {
    message: "Registration successful. Please check your email to verify your account.",
    userId: user._id.toString(),
  };
}

export async function verifyEmail(token: string) {
  const hashedToken = hashToken(token);

  const tokenDoc = await Token.findOne({ token: hashedToken });

  if (!tokenDoc) {
    throw new NotFoundError("Invalid or expired verification token");
  }

  if (tokenDoc.expiresAt < new Date()) {
    const user = await User.findById(tokenDoc.userId);

    if (user) {
      if (user.isEmailVerified) {
        throw new BadRequest("Email is already verified");
      }

      const { rawToken, hashedToken: newHashedToken } = generateToken();
      await new Token({
        token: newHashedToken,
        userId: user._id.toString(),
        type: "EMAIL_VERIFICATION",
        expiresAt: new Date(Date.now() + TOKEN_EXPIRY.EMAIL_VERIFICATION),
      }).save();
      await sendEmailVerification({ email: user.email, token: rawToken });
    }

    throw new AppError(
      "Verification token has expired. A new verification link has been sent to your email.",
      400,
    );
  }

  const user = await User.findById(tokenDoc.userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  user.isEmailVerified = true;
  user.status = "ACTIVE";
  await user.save();

  await tokenDoc.deleteOne();

  return { message: "Email verified successfully. You can now log in." };
}

export async function login(
  data: LoginSchemaDto & {
    ipAddress?: string;
    userAgent?: string;
    deviceFingerprint?: string;
  },
) {
  const { email, password, ipAddress, userAgent, deviceFingerprint } = data;

  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user) {
    throw new AuthError("Invalid email or password");
  }

  if (!user.isEmailVerified) {
    throw new AppError("Please verify your email before logging in", 403);
  }

  if (user.status !== "ACTIVE") {
    throw new AppError(`Account is ${user.status.toLowerCase()}`, 403);
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AuthError("Invalid email or password");
  }

  const session = await new UserSession({
    userId: user._id.toString(),
    ipAddress,
    userAgent,
    deviceFingerprint,
    expiresAt: new Date(Date.now() + TOKEN_EXPIRY.REFRESH_TOKEN),
  }).save();

  const sessionId = session._id.toString();
  const userId = user._id.toString();

  const accessToken = generateAccessToken(userId, sessionId);
  const refreshToken = generateRefreshToken(userId, sessionId);

  session.sessionTokenHash = hashToken(accessToken);
  session.refreshTokenHash = hashToken(refreshToken);
  await session.save();

  user.lastLoginAt = new Date();
  await user.save();

  return {
    accessToken,
    refreshToken,
    user: {
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      isEmailVerified: user.isEmailVerified,
    },
  };
}

export async function refreshAccessToken(refreshToken: string) {
  const { userId, sessionId } = verifyRefreshToken(refreshToken);

  const refreshTokenHash = hashToken(refreshToken);

  const session = await UserSession.findOne({
    _id: sessionId,
    userId,
    refreshTokenHash,
    isActive: true,
    revokedAt: null,
  }).select("+refreshTokenHash");

  if (!session) {
    throw new AuthError("Invalid or revoked refresh token");
  }

  if (session.expiresAt < new Date()) {
    throw new AuthError("Session has expired. Please log in again.");
  }

  const newAccessToken = generateAccessToken(userId, sessionId);

  session.sessionTokenHash = hashToken(newAccessToken);
  session.lastActivity = new Date();
  await session.save();

  return { accessToken: newAccessToken };
}

export async function logout(sessionId: string) {
  const session = await UserSession.findById(sessionId);
  if (!session) {
    throw new NotFoundError("Session not found");
  }

  session.isActive = false;
  session.revokedAt = new Date();
  await session.save();

  return { message: "Logged out successfully" };
}

export async function validateSession(accessToken: string, sessionId: string) {
  const sessionTokenHash = hashToken(accessToken);

  const session = await UserSession.findOne({
    _id: sessionId,
    sessionTokenHash,
    isActive: true,
    revokedAt: null,
  }).select("+sessionTokenHash");

  if (!session) {
    throw new AuthError("Invalid or revoked session");
  }

  if (session.expiresAt < new Date()) {
    throw new AuthError("Session has expired");
  }

  session.lastActivity = new Date();
  await session.save();

  return session;
}
