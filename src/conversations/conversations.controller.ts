import {
  Controller,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ConversationsService } from './conversations.service.js';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':userId')
  openConversation(
    @Req() request: any,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.conversationsService.openConversation(request.user.sub, userId);
  }
}
