import { relations } from "drizzle-orm";
import {
  pgTable,
  serial,
  varchar,
  timestamp,
  uniqueIndex,
  pgEnum,
  boolean,
} from "drizzle-orm/pg-core";

export const userStatusEnum = pgEnum("user_status", [
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
  "PENDING_VERIFICATION",
]);

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    isEmailVerified: boolean("is_email_verified").default(false).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    status: userStatusEnum().default("ACTIVE").notNull(),
    lastLoginAt: timestamp("last_login_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)],
);

export type UserDto = typeof users.$inferSelect;
