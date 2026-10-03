import { Module } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { MessagesController } from './messages.controller.js';
import { MessagesService } from './messages.service.js';

@Module({
  controllers: [MessagesController],
  providers: [MessagesService, JwtAuthGuard],
  exports: [MessagesService],
})
export class MessagesModule {}
