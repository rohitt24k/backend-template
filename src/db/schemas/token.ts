import {
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./user";
import { relations } from "drizzle-orm";

export const tokenTypeEnum = pgEnum("token_type", [
  "EMAIL_VERIFICATION",
  "PASSWORD_RESET",
  "LOGIN",
]);

export const tokens = pgTable(
  "tokens",
  {
    id: serial("id").primaryKey(),
    token: varchar("token", { length: 255 }).notNull(),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    type: tokenTypeEnum().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("tokens_token_unique").on(table.token),
    index("tokens_user_id_idx").on(table.userId),
    index("tokens_type_idx").on(table.type),
  ],
);

export const tokenRelations = relations(tokens, ({ one }) => ({
  user: one(users, {
    fields: [tokens.userId],
    references: [users.id],
  }),
}));
