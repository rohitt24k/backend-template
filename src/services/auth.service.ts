import { generateToken, hashToken } from "../lib/token";
import { sendEmailVerification } from "../utils/verificationEmail";
import { TOKEN_EXPIRY } from "../utils/constants";
import { AppError, AuthError, NotFoundError } from "../errors";
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/auth";
import { db } from "../db";
import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { users, userSessions } from "../db/schemas";
import { tokens } from "../db/schemas/token";

export async function registerUser(data: {
  email: string;
  name: string;
  password: string;
}) {
  const { email, name, password } = data;

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existingUser) {
    throw new AppError("User with this email already exists", 409);
  }

  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(users)
    .values({
      email,
      name,
      passwordHash,
      status: "PENDING_VERIFICATION",
      isEmailVerified: false,
    })
    .returning({
      id: users.id,
    });

  const { rawToken, hashedToken } = generateToken();

  await db.insert(tokens).values({
    token: hashedToken,
    userId: user.id,
    type: "EMAIL_VERIFICATION",
    expiresAt: new Date(Date.now() + TOKEN_EXPIRY.EMAIL_VERIFICATION),
  });

  await sendEmailVerification({ email, token: rawToken });

  return {
    message:
      "Registration successful. Please check your email to verify your account.",
    userId: user.id,
  };
}

export async function verifyEmail(token: string) {
  const hashedToken = hashToken(token);

  const tokenDoc = await db.query.tokens.findFirst({
    where: eq(tokens.token, hashedToken),
  });

  if (!tokenDoc) {
    throw new NotFoundError("Invalid or expired verification token");
  }

  if (tokenDoc.expiresAt < new Date()) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, tokenDoc.userId),
    });

    if (user) {
      if (user.isEmailVerified) {
        throw new AppError("Email is already verified", 400);
      }

      const { rawToken, hashedToken } = generateToken();
      await db.insert(tokens).values({
        token: hashedToken,
        userId: user.id,
        type: "EMAIL_VERIFICATION",
        expiresAt: new Date(Date.now() + TOKEN_EXPIRY.EMAIL_VERIFICATION),
      });
      await sendEmailVerification({ email: user.email, token: rawToken });
    }

    throw new AppError(
      "Verification token has expired. A new verification link has been sent to your email.",
      400,
    );
  }

  const [user] = await db
    .update(users)
    .set({
      isEmailVerified: true,
      status: "ACTIVE",
    })
    .where(eq(users.id, tokenDoc.userId))
    .returning();

  if (!user) {
    throw new NotFoundError("User not found");
  }

  await db.delete(tokens).where(eq(tokens.id, tokenDoc.id));

  return {
    message: "Email verified successfully. You can now log in.",
  };
}

export async function login(data: {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
}) {
  const { email, password, ipAddress, userAgent, deviceFingerprint } = data;

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (!user) {
    throw new AuthError("Invalid email or password");
  }

  if (!user.isEmailVerified) {
    throw new AppError("Please verify your email before logging in", 403);
  }

  if (user.status !== "ACTIVE") {
    throw new AppError(`Account is ${user.status.toLowerCase()}`, 403);
  }

  if (!user.passwordHash) {
    throw new AppError("Please complete your account setup", 400);
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AuthError("Invalid email or password");
  }

  const [session] = await db
    .insert(userSessions)
    .values({
      userId: user.id,
      ipAddress,
      userAgent,
      deviceFingerprint,
      expiresAt: new Date(Date.now() + TOKEN_EXPIRY.REFRESH_TOKEN),
    })
    .returning({
      id: userSessions.id,
    });

  const finalAccessToken = generateAccessToken(
    user.id.toString(),
    session.id.toString(),
  );
  const finalRefreshToken = generateRefreshToken(
    user.id.toString(),
    session.id.toString(),
  );

  await db
    .update(userSessions)
    .set({
      sessionTokenHash: hashToken(finalAccessToken),
      refreshTokenHash: hashToken(finalRefreshToken),
    })
    .where(eq(userSessions.id, session.id));

  return {
    accessToken: finalAccessToken,
    refreshToken: finalRefreshToken,
    user: {
      email: user.email,
      name: user.name,
      status: user.status,
      isEmailVerified: user.isEmailVerified,
    },
  };
}

export async function refreshAccessToken(refreshToken: string) {
  const { userId, sessionId } = verifyRefreshToken(refreshToken);

  const refreshTokenHash = hashToken(refreshToken);

  const session = await db.query.userSessions.findFirst({
    where: and(
      eq(userSessions.id, parseInt(sessionId, 10)),
      eq(userSessions.userId, parseInt(userId, 10)),
      eq(userSessions.refreshTokenHash, refreshTokenHash),
      eq(userSessions.isActive, true),
      isNull(userSessions.revokedAt),
    ),
  });

  if (!session) {
    throw new AuthError("Invalid or revoked refresh token");
  }

  if (session.expiresAt < new Date()) {
    throw new AuthError("Session has expired. Please log in again.");
  }

  const newAccessToken = generateAccessToken(userId, sessionId);

  await db
    .update(userSessions)
    .set({
      sessionTokenHash: hashToken(newAccessToken),
      lastActivity: new Date(),
    })
    .where(eq(userSessions.id, parseInt(sessionId, 10)));

  return {
    accessToken: newAccessToken,
  };
}

export async function logout(sessionId: number) {
  await db
    .update(userSessions)
    .set({
      isActive: false,
      revokedAt: new Date(),
    })
    .where(eq(userSessions.id, sessionId));

  return {
    message: "Logged out successfully",
  };
}

export async function validateSession(accessToken: string, sessionId: number) {
  const sessionTokenHash = hashToken(accessToken);

  const session = await db.query.userSessions.findFirst({
    where: and(
      eq(userSessions.id, sessionId),
      eq(userSessions.sessionTokenHash, sessionTokenHash),
      eq(userSessions.isActive, true),
      isNull(userSessions.revokedAt),
    ),
  });

  if (!session) {
    throw new AuthError("Invalid or revoked session");
  }

  if (session.expiresAt < new Date()) {
    throw new AuthError("Session has expired");
  }

  await db
    .update(userSessions)
    .set({
      lastActivity: new Date(),
    })
    .where(eq(userSessions.id, sessionId));

  return session;
}
