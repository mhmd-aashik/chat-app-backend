import { Module } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ConversationsController } from './conversations.controller.js';
import { ConversationsService } from './conversations.service.js';

@Module({
  controllers: [ConversationsController],
  providers: [ConversationsService, JwtAuthGuard],
  exports: [ConversationsService],
})
export class ConversationsModule {}
