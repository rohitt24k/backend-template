import { Request, Response, NextFunction } from "express";
import { ZodObject, ZodError } from "zod";
import { GenerateResponse } from "../utils/generateResponse";

export const validate =
  (schema: ZodObject<any>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors for frontend
        const errors = error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        // Get the first error message for the main response
        const firstError = errors[0]?.message || "Validation failed";

        return GenerateResponse(
          res,
          400,
          {
            errors,
          },
          firstError
        );
      }

      // If it's not a Zod error, pass to error handler
      next(error);
    }
  };
