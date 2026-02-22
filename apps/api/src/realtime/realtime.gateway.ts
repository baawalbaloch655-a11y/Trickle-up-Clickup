import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface AuthenticatedSocket extends Socket {
    userId?: string;
    userEmail?: string;
}

@WebSocketGateway({
    cors: {
        origin: ['http://localhost:5173', 'http://localhost:80'],
        credentials: true,
    },
    namespace: '/',
})
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private readonly logger = new Logger(RealtimeGateway.name);
    private onlineUsers = new Map<string, Set<string>>(); // orgId -> Set of userIds

    constructor(
        private readonly jwtService: JwtService,
        private readonly config: ConfigService,
    ) { }

    afterInit(server: Server) {
        this.logger.log('⚡ WebSocket Gateway initialized');
    }

    async handleConnection(client: AuthenticatedSocket) {
        try {
            const token =
                client.handshake.auth?.token ||
                client.handshake.headers?.authorization?.replace('Bearer ', '');

            if (!token) {
                client.disconnect();
                return;
            }

            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.config.get<string>('JWT_ACCESS_SECRET'),
            });

            client.userId = payload.sub;
            client.userEmail = payload.email;
            this.logger.log(`Client connected: ${client.id} (User: ${payload.email})`);
        } catch {
            this.logger.warn(`Unauthorized WS connection attempt: ${client.id}`);
            client.disconnect();
        }
    }

    handleDisconnect(client: AuthenticatedSocket) {
        this.logger.log(`Client disconnected: ${client.id}`);
        // Remove from all org rooms
        this.onlineUsers.forEach((users, orgId) => {
            if (client.userId && users.has(client.userId)) {
                users.delete(client.userId);
                this.server.to(`org:${orgId}`).emit('presence:update', {
                    onlineUsers: Array.from(users),
                });
            }
        });
    }

    @SubscribeMessage('room:join')
    handleRoomJoin(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { orgId: string },
    ) {
        const room = `org:${data.orgId}`;
        client.join(room);
        this.logger.log(`User ${client.userId} joined room ${room}`);

        // Track presence
        if (!this.onlineUsers.has(data.orgId)) {
            this.onlineUsers.set(data.orgId, new Set());
        }
        if (client.userId) {
            this.onlineUsers.get(data.orgId)!.add(client.userId);
        }

        // Broadcast updated presence
        this.server.to(room).emit('presence:update', {
            onlineUsers: Array.from(this.onlineUsers.get(data.orgId) || []),
        });

        return { event: 'room:joined', data: { room } };
    }

    @SubscribeMessage('room:leave')
    handleRoomLeave(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { orgId: string },
    ) {
        const room = `org:${data.orgId}`;
        client.leave(room);

        if (client.userId && this.onlineUsers.has(data.orgId)) {
            this.onlineUsers.get(data.orgId)!.delete(client.userId);
            this.server.to(room).emit('presence:update', {
                onlineUsers: Array.from(this.onlineUsers.get(data.orgId) || []),
            });
        }
    }

    // ── Server-side emit helpers (called by other services) ──

    emitToOrg(orgId: string, event: string, data: unknown) {
        this.server.to(`org:${orgId}`).emit(event, data);
    }

    emitToUser(userId: string, event: string, data: unknown) {
        this.server.to(`user:${userId}`).emit(event, data);
    }

    notifyTaskCreated(orgId: string, projectId: string, taskId: string, actorId: string, data: unknown) {
        this.emitToOrg(orgId, 'task.created', { orgId, projectId, taskId, actorId, timestamp: new Date().toISOString(), task: data });
    }

    notifyTaskUpdated(orgId: string, projectId: string, taskId: string, actorId: string, data: unknown) {
        this.emitToOrg(orgId, 'task.updated', { orgId, projectId, taskId, actorId, timestamp: new Date().toISOString(), task: data });
    }

    notifyTaskDeleted(orgId: string, projectId: string, taskId: string, actorId: string) {
        this.emitToOrg(orgId, 'task.deleted', { orgId, projectId, taskId, actorId, timestamp: new Date().toISOString() });
    }

    notifyNewNotification(userId: string, notification: unknown) {
        this.server.to(`user:${userId}`).emit('notification.new', { notification });
    }

    notifyNewMessage(orgId: string, targetId: string, targetType: 'CHANNEL' | 'CONVERSATION', message: any) {
        const room = targetType === 'CHANNEL' ? `channel:${targetId}` : `conversation:${targetId}`;
        this.server.to(room).emit('message.new', { targetId, targetType, message });
    }

    @SubscribeMessage('chat:join')
    handleChatJoin(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { targetId: string; targetType: 'CHANNEL' | 'CONVERSATION' }
    ) {
        const room = data.targetType === 'CHANNEL' ? `channel:${data.targetId}` : `conversation:${data.targetId}`;
        client.join(room);
        this.logger.log(`User ${client.userId} joined chat room ${room}`);
    }

    @SubscribeMessage('chat:leave')
    handleChatLeave(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { targetId: string; targetType: 'CHANNEL' | 'CONVERSATION' }
    ) {
        const room = data.targetType === 'CHANNEL' ? `channel:${data.targetId}` : `conversation:${data.targetId}`;
        client.leave(room);
    }

    @SubscribeMessage('task:typing')
    handleTaskTyping(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { orgId: string; taskId: string; isTyping: boolean }
    ) {
        if (!client.userId) return;
        const room = `org:${data.orgId}`;
        client.to(room).emit('task:typing_update', {
            taskId: data.taskId,
            userId: client.userId,
            userName: client.userEmail, // Simple fallback
            isTyping: data.isTyping
        });
    }
}
