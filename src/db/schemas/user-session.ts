import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./user";
import { relations } from "drizzle-orm";

export const userSessions = pgTable(
  "user_sessions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    sessionTokenHash: varchar("session_token", { length: 255 }),
    refreshTokenHash: varchar("refresh_token_hash", { length: 255 }),
    ipAddress: varchar("ip_address", { length: 255 }),
    userAgent: varchar("user_agent", { length: 255 }),
    deviceFingerprint: varchar("device_fingerprint", { length: 255 }),
    isActive: boolean("is_active").default(true).notNull(),
    revokedAt: timestamp("revoked_at"),
    expiresAt: timestamp("expires_at").notNull(),
    lastActivity: timestamp("last_activity").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("user_sessions_session_token_unique").on(
      table.sessionTokenHash,
    ),
    uniqueIndex("user_sessions_refresh_token_hash_unique").on(
      table.refreshTokenHash,
    ),
    index("user_sessions_user_id_idx").on(table.userId),
    index("user_sessions_is_active_idx").on(table.isActive),
  ],
);

export const userSessionRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
}));
