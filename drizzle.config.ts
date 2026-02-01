import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
config();

export default defineConfig({
  out: "./src/db/migrations",
  dialect: "postgresql",
  schema: "./src/db/schemas/index.ts",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
