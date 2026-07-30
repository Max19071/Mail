import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const mailboxes = sqliteTable("mailboxes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  address: text("address").notNull().unique(),
  displayName: text("display_name").notNull(),
  apiKey: text("api_key").notNull().unique(),
  createdAt: text("created_at").notNull(),
});

export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  mailboxId: integer("mailbox_id")
    .notNull()
    .references(() => mailboxes.id, { onDelete: "cascade" }),
  fromAddress: text("from_address").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
  receivedAt: text("received_at").notNull(),
});
