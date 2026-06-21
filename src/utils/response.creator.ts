import { Response } from "express";

const DEFAULT_MESSAGES: Record<number, string> = {
  200: "Request successful",
  201: "Resource created successfully",
  202: "Request accepted",
  204: "No content",
  400: "Bad request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Resource not found",
  409: "Conflict",
  422: "Unprocessable entity",
  500: "Internal server error",
  502: "Bad gateway",
  503: "Service unavailable",
};

export function GenerateResponse<T>(
  res: Response,
  statusCode: number,
  result?: T,
  message?: string,
): Response {
  const success = statusCode >= 200 && statusCode < 300;

  return res.status(statusCode).json({
    success,
    message:
      message ||
      DEFAULT_MESSAGES[statusCode] ||
      (success ? "Success" : "Something went wrong"),
    data: result,
  });
}
