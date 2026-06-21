import z from "zod";
import { ObjectIDParamsSchema, PaginationSchema } from "../schemas/common.schema";

export type ObjectIDParamsSchemaDto = z.infer<typeof ObjectIDParamsSchema>;
export type PaginationSchemaDto = z.infer<typeof PaginationSchema>;
