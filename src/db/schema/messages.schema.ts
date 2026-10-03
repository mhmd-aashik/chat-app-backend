import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

import { conversations } from './conversations.schema.js';
import { users } from './users.schema.js';

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),

  conversationId: integer('conversation_id')
    .notNull()
    .references(() => conversations.id, {
      onDelete: 'cascade',
    }),

  senderId: integer('sender_id')
    .notNull()
    .references(() => users.id, {
      onDelete: 'cascade',
    }),

  content: text('content').notNull(),

  deliveredAt: timestamp('delivered_at'),

  readAt: timestamp('read_at'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});
