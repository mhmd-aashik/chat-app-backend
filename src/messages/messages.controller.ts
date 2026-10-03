import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { SendMessageDto } from './dto/send-message.dto.js';
import { MessagesService } from './messages.service.js';

@Controller('conversations/:conversationId/messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  sendMessage(
    @Req() request: any,
    @Param('conversationId', ParseIntPipe)
    conversationId: number,
    @Body() dto: SendMessageDto,
  ) {
    return this.messagesService.sendMessage(
      conversationId,
      request.user.sub,
      dto.content,
    );
  }

  @Get()
  getMessages(
    @Req() request: any,
    @Param('conversationId', ParseIntPipe)
    conversationId: number,
  ) {
    return this.messagesService.getMessages(conversationId, request.user.sub);
  }
}
