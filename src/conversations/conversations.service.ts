import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { and, eq, exists } from 'drizzle-orm';

import { DbService } from '../db/db.service.js';

import {
  conversationMembers,
  conversations,
  users,
} from '../db/schema/index.js';

@Injectable()
export class ConversationsService {
  constructor(private readonly dbService: DbService) {}

  async openConversation(currentUserId: number, otherUserId: number) {
    if (currentUserId === otherUserId) {
      throw new BadRequestException(
        'You cannot create a conversation with yourself',
      );
    }

    // Make sure the other user exists
    const otherUser = await this.dbService.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, otherUserId))
      .limit(1);

    if (!otherUser[0]) {
      throw new NotFoundException('User not found');
    }

    // Check if these two users already share a conversation
    const existingConversation = await this.dbService.db
      .select({
        id: conversations.id,
        createdAt: conversations.createdAt,
      })
      .from(conversations)
      .where(
        and(
          exists(
            this.dbService.db
              .select()
              .from(conversationMembers)
              .where(
                and(
                  eq(conversationMembers.conversationId, conversations.id),
                  eq(conversationMembers.userId, currentUserId),
                ),
              ),
          ),

          exists(
            this.dbService.db
              .select()
              .from(conversationMembers)
              .where(
                and(
                  eq(conversationMembers.conversationId, conversations.id),
                  eq(conversationMembers.userId, otherUserId),
                ),
              ),
          ),
        ),
      )
      .limit(1);

    // Return existing chat
    if (existingConversation[0]) {
      return {
        conversation: existingConversation[0],
        user: otherUser[0],
        existing: true,
      };
    }

    // Create conversation
    const createdConversation = await this.dbService.db
      .insert(conversations)
      .values({})
      .returning();

    const conversation = createdConversation[0];

    // Add both users
    await this.dbService.db.insert(conversationMembers).values([
      {
        conversationId: conversation.id,
        userId: currentUserId,
      },
      {
        conversationId: conversation.id,
        userId: otherUserId,
      },
    ]);

    return {
      conversation,
      user: otherUser[0],
      existing: false,
    };
  }
}
