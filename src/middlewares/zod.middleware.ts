import { NextFunction, Request, Response } from "express";
import z, { ZodError } from "zod";
import { GenerateResponse } from "../utils/response.creator";

export const zodMiddleware =
  (schema: {
    body?: z.ZodTypeAny;
    query?: z.ZodTypeAny;
    params?: z.ZodTypeAny;
  }) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body) res.locals.body = schema.body.parse(req.body);
      if (schema.query) res.locals.query = schema.query.parse(req.query);
      if (schema.params) res.locals.params = schema.params.parse(req.params);

      next();
    } catch (err: unknown) {
      if (err instanceof ZodError) {
        return GenerateResponse(res, 422, err.format(), "Validation failed.");
      }

      return GenerateResponse(res, 500, {}, "Internal server error.");
    }
  };
