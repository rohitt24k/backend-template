import { Schema, model } from "mongoose";
import { UserSessionDto } from "../dto/auth.dto";

const userSessionSchema = new Schema<UserSessionDto>(
  {
    userId: { type: String, required: true, index: true },
    sessionTokenHash: { type: String, select: false },
    refreshTokenHash: { type: String, select: false },
    ipAddress: { type: String },
    userAgent: { type: String },
    deviceFingerprint: { type: String },
    isActive: { type: Boolean, default: true, index: true },
    revokedAt: { type: Date },
    expiresAt: { type: Date, required: true },
    lastActivity: { type: Date },
  },
  { timestamps: true },
);

export const UserSession = model<UserSessionDto>("UserSession", userSessionSchema);
