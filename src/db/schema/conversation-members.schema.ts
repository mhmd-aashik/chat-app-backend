import {
  integer,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

import { conversations } from './conversations.schema.js';
import { users } from './users.schema.js';

export const conversationMembers = pgTable(
  'conversation_members',
  {
    id: serial('id').primaryKey(),

    conversationId: integer('conversation_id')
      .notNull()
      .references(() => conversations.id, {
        onDelete: 'cascade',
      }),

    userId: integer('user_id')
      .notNull()
      .references(() => users.id, {
        onDelete: 'cascade',
      }),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },

  (table) => [
    uniqueIndex('conversation_user_unique').on(
      table.conversationId,
      table.userId,
    ),
  ],
);
