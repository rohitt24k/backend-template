import { config } from "dotenv";
config();

export const MONGO_URI = process.env.MONGO_URI || "";
export const SALT_ROUNDS = 10;
export const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
export const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "your-refresh-secret";
export const FRONTEND_URL = process.env.FRONTEND_URL || "localhost:3000";
