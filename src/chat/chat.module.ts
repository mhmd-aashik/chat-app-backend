import { Module } from '@nestjs/common';

import { MessagesModule } from '../messages/messages.module.js';
import { ChatGateway } from './chat.gateway.js';

@Module({
  imports: [MessagesModule],
  providers: [ChatGateway],
})
export class ChatModule {}
