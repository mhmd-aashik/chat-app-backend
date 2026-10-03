import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

import { MessagesService } from '../messages/messages.service.js';

type AuthenticatedSocket = Socket & {
  userId?: number;
};

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly messagesService: MessagesService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token;

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync<{
        sub: number;
        email: string;
      }>(token);

      client.userId = payload.sub;

      console.log(`Socket connected: user ${client.userId}`);
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage('joinConversation')
  handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
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
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: {
      conversationId: number;
      content: string;
    },
  ) {
    if (!client.userId) {
      client.disconnect();
      return;
    }

    const message = await this.messagesService.sendMessage(
      data.conversationId,
      client.userId,
      data.content,
    );

    this.server
      .to(`conversation:${data.conversationId}`)
      .emit('newMessage', message);

    return {
      event: 'messageSent',
      data: message,
    };
  }
}
