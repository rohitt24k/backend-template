import { drizzle } from "drizzle-orm/neon-http";
import { DATABASE_URL } from "../config/app-config";
import * as Schema from "./schemas";
import { neon } from "@neondatabase/serverless";

const sql = neon(DATABASE_URL);

export const db = drizzle(sql, { schema: Schema });
