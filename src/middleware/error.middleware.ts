import { Request, Response, NextFunction } from "express";
import { GenerateResponse } from "../utils/generateResponse";
import { AppError } from "../errors";
import mongoose from "mongoose";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // Default values
  let statusCode = 500;
  let message = "Internal server error";

  // Known operational error
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  } else if ((err as any)?.code === 11000) {
    statusCode = 409;
    const fields = Object.keys((err as any).keyValue).join(", ");
    message = `Duplicate value for field(s): ${fields}`;
  }

  // Log non-operational errors
  if (!(err instanceof AppError)) {
    console.error("🔥 Unexpected Error:", err);
  }

  return GenerateResponse(res, statusCode, null, message);
}
