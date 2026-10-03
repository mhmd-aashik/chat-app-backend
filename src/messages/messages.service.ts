import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, lt } from 'drizzle-orm';

import { DbService } from '../db/db.service.js';
import {
  conversationMembers,
  conversations,
  messages,
} from '../db/schema/index.js';

@Injectable()
export class MessagesService {
  constructor(private readonly dbService: DbService) {}

  async ensureUserInConversation(conversationId: number, userId: number) {
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

  async getMessages(
    conversationId: number,
    currentUserId: number,
    cursor?: number,
    limit = 20,
  ) {
    await this.ensureUserInConversation(conversationId, currentUserId);

    const safeLimit = Math.min(limit, 50);

    const conditions = [eq(messages.conversationId, conversationId)];

    if (cursor) {
      conditions.push(lt(messages.id, cursor));
    }

    const result = await this.dbService.db
      .select()
      .from(messages)
      .where(and(...conditions))
      .orderBy(desc(messages.id))
      .limit(safeLimit + 1);

    const hasMore = result.length > safeLimit;

    const page = hasMore ? result.slice(0, safeLimit) : result;

    const nextCursor =
      hasMore && page.length > 0 ? page[page.length - 1].id : null;

    return {
      data: page.reverse(),
      nextCursor,
      hasMore,
    };
  }

  async markDelivered(messageId: number, currentUserId: number) {
    const message = await this.dbService.db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    if (!message[0]) {
      throw new NotFoundException('Message not found');
    }

    await this.ensureUserInConversation(
      message[0].conversationId,
      currentUserId,
    );

    if (message[0].senderId === currentUserId) {
      throw new ForbiddenException(
        'You cannot mark your own message as delivered',
      );
    }

    const result = await this.dbService.db
      .update(messages)
      .set({
        deliveredAt: new Date(),
      })
      .where(eq(messages.id, messageId))
      .returning();

    return result[0];
  }

  async markRead(messageId: number, currentUserId: number) {
    const message = await this.dbService.db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    if (!message[0]) {
      throw new NotFoundException('Message not found');
    }

    await this.ensureUserInConversation(
      message[0].conversationId,
      currentUserId,
    );

    if (message[0].senderId === currentUserId) {
      throw new ForbiddenException('You cannot mark your own message as read');
    }

    const now = new Date();

    const result = await this.dbService.db
      .update(messages)
      .set({
        deliveredAt: message[0].deliveredAt ?? now,
        readAt: now,
      })
      .where(eq(messages.id, messageId))
      .returning();

    return result[0];
  }
}
