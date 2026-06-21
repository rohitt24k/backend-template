import { Schema, model } from "mongoose";
import { TokenDto } from "../dto/auth.dto";

const tokenSchema = new Schema<TokenDto>(
  {
    token: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ["EMAIL_VERIFICATION", "PASSWORD_RESET", "LOGIN"],
      required: true,
    },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

export const Token = model<TokenDto>("Token", tokenSchema);
