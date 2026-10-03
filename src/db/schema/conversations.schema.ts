import { pgTable, serial, timestamp } from 'drizzle-orm/pg-core';

export const conversations = pgTable('conversations', {
  id: serial('id').primaryKey(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});
