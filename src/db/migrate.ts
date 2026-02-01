import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { DATABASE_URL } from "../config/app-config";

const runMigrations = async () => {
  console.log("⏳ Running migrations...");

  const pool = new Pool({
    connectionString: DATABASE_URL,
  });
  const db = drizzle(pool);

  await migrate(db, { migrationsFolder: "./src/db/migrations" });

  console.log("✅ Migrations completed!");
  await pool.end();
  process.exit(0);
};

runMigrations().catch((err) => {
  console.error("❌ Migration failed!");
  console.error(err);
  process.exit(1);
});
