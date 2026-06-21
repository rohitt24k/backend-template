import { Express } from "express-serve-static-core";

declare global {
  namespace Express {
    interface Locals {
      user?: {
        userId: string;
        sessionId: string;
      };
      body?: unknown;
      query?: unknown;
      params?: unknown;
    }
  }
}
