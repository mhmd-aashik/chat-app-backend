import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';

import { DbService } from '../db/db.service.js';
import {
  conversationMembers,
  conversations,
  messages,
} from '../db/schema/index.js';

@Injectable()
export class MessagesService {
  constructor(private readonly dbService: DbService) {}

  private async ensureUserInConversation(
    conversationId: number,
    userId: number,
  ) {
    const conversation = await this.dbService.db
      .select({
        id: conversations.id,
      })
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (!conversation[0]) {
      throw new NotFoundException('Conversation not found');
    }

    const membership = await this.dbService.db
      .select({
        id: conversationMembers.id,
      })
      .from(conversationMembers)
      .where(
        and(
          eq(conversationMembers.conversationId, conversationId),
          eq(conversationMembers.userId, userId),
        ),
      )
      .limit(1);

    if (!membership[0]) {
      throw new ForbiddenException('You are not a member of this conversation');
    }
  }

  async sendMessage(conversationId: number, senderId: number, content: string) {
    await this.ensureUserInConversation(conversationId, senderId);

    const result = await this.dbService.db
      .insert(messages)
      .values({
        conversationId,
        senderId,
        content,
      })
      .returning();

    return result[0];
  }

  async getMessages(conversationId: number, currentUserId: number) {
    await this.ensureUserInConversation(conversationId, currentUserId);

    return this.dbService.db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt));
  }
}
