import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

import { MessagesService } from '../messages/messages.service.js';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly messagesService: MessagesService) {}

  @SubscribeMessage('joinConversation')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      conversationId: number;
    },
  ) {
    const room = `conversation:${data.conversationId}`;

    client.join(room);

    return {
      event: 'joinedConversation',
      data: {
        conversationId: data.conversationId,
      },
    };
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      conversationId: number;
      senderId: number;
      content: string;
    },
  ) {
    const message = await this.messagesService.sendMessage(
      data.conversationId,
      data.senderId,
      data.content,
    );

    const room = `conversation:${data.conversationId}`;

    this.server.to(room).emit('newMessage', message);

    return {
      event: 'messageSent',
      data: message,
    };
  }
}
