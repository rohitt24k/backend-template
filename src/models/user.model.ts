import { Schema, model } from "mongoose";
import { UserDto } from "../dto/auth.dto";

const userSchema = new Schema<UserDto>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    isEmailVerified: { type: Boolean, default: false },
    role: { type: String, enum: ["USER", "ADMIN"], default: "USER" },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING_VERIFICATION"],
      default: "PENDING_VERIFICATION",
    },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

export const User = model<UserDto>("User", userSchema);
