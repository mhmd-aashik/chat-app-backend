import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
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
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly onlineUsers = new Map<number, Set<string>>();

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

      const sockets = this.onlineUsers.get(client.userId) ?? new Set<string>();

      sockets.add(client.id);

      this.onlineUsers.set(client.userId, sockets);

      this.server.emit('userOnline', {
        userId: client.userId,
      });

      console.log(`User ${client.userId} connected`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (!client.userId) {
      return;
    }

    const sockets = this.onlineUsers.get(client.userId);

    if (!sockets) {
      return;
    }

    sockets.delete(client.id);

    if (sockets.size === 0) {
      this.onlineUsers.delete(client.userId);

      this.server.emit('userOffline', {
        userId: client.userId,
      });
    }

    console.log(`User ${client.userId} disconnected`);
  }

  @SubscribeMessage('getOnlineUsers')
  getOnlineUsers() {
    return {
      event: 'onlineUsers',
      data: Array.from(this.onlineUsers.keys()),
    };
  }

  @SubscribeMessage('joinConversation')
  async handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: {
      conversationId: number;
    },
  ) {
    if (!client.userId) {
      client.disconnect();
      return;
    }

    await this.messagesService.ensureUserInConversation(
      data.conversationId,
      client.userId,
    );

    await client.join(`conversation:${data.conversationId}`);

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

  @SubscribeMessage('typingStart')
  async handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: {
      conversationId: number;
    },
  ) {
    if (!client.userId) {
      return;
    }

    await this.messagesService.ensureUserInConversation(
      data.conversationId,
      client.userId,
    );

    client.to(`conversation:${data.conversationId}`).emit('userTyping', {
      conversationId: data.conversationId,
      userId: client.userId,
      isTyping: true,
    });
  }

  @SubscribeMessage('typingStop')
  async handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: {
      conversationId: number;
    },
  ) {
    if (!client.userId) {
      return;
    }

    await this.messagesService.ensureUserInConversation(
      data.conversationId,
      client.userId,
    );

    client.to(`conversation:${data.conversationId}`).emit('userTyping', {
      conversationId: data.conversationId,
      userId: client.userId,
      isTyping: false,
    });
  }
}
