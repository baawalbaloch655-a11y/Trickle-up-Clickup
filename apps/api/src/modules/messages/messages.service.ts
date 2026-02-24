import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMessageDto } from './dto/message.dto';
import { RealtimeGateway } from '../../realtime/realtime.gateway';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MessagesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly realtimeGateway: RealtimeGateway,
        private readonly notificationsService: NotificationsService
    ) { }

    async create(userId: string, orgId: string, dto: CreateMessageDto) {
        const { content, channelId, conversationId } = dto;

        if (!channelId && !conversationId) {
            throw new NotFoundException('Target not specified');
        }

        const message = await this.prisma.message.create({
            data: {
                content,
                userId,
                channelId,
                conversationId,
            },
            include: {
                user: { select: { id: true, name: true, avatarUrl: true } },
            },
        });

        // Broadcast realtime
        const targetId = channelId || conversationId;
        const targetType = channelId ? 'CHANNEL' : 'CONVERSATION';
        this.realtimeGateway.notifyNewMessage(orgId, targetId!, targetType, message);

        // Notify members globally of the new message
        if (channelId) {
            const members = await this.prisma.channelMember.findMany({
                where: { channelId, userId: { not: userId } },
                select: { userId: true }
            });
            for (const member of members) {
                this.realtimeGateway.emitToUser(member.userId, 'message.notify', {
                    targetId,
                    targetType,
                    message
                });

                await this.notificationsService.create({
                    orgId,
                    userId: member.userId,
                    type: 'SYSTEM',
                    title: `New Team message from ${message.user.name}`,
                    body: message.content,
                    metadata: { isChat: true, targetId, targetType }
                });
            }
        } else if (conversationId) {
            const members = await this.prisma.conversationMember.findMany({
                where: { conversationId, userId: { not: userId } },
                select: { userId: true }
            });
            for (const member of members) {
                this.realtimeGateway.emitToUser(member.userId, 'message.notify', {
                    targetId,
                    targetType,
                    message
                });

                await this.notificationsService.create({
                    orgId,
                    userId: member.userId,
                    type: 'SYSTEM',
                    title: `New DM from ${message.user.name}`,
                    body: message.content,
                    metadata: { isChat: true, targetId, targetType }
                });
            }
        }

        return message;
    }

    async findAllForChannel(orgId: string, channelId: string, userId: string) {
        // Verify access (reusing logic from a potential ChannelsService or inline)
        const member = await this.prisma.channelMember.findFirst({
            where: { channelId, userId },
        });
        const channel = await this.prisma.channel.findUnique({ where: { id: channelId } });

        if (!channel) throw new NotFoundException('Channel not found');
        if (channel.isPrivate && !member) throw new ForbiddenException('Access denied');

        return this.prisma.message.findMany({
            where: { channelId, deletedAt: null },
            include: {
                user: { select: { id: true, name: true, avatarUrl: true } },
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    async findAllForConversation(orgId: string, conversationId: string, userId: string) {
        const member = await this.prisma.conversationMember.findFirst({
            where: { conversationId, userId },
        });

        if (!member) throw new ForbiddenException('Access denied');

        return this.prisma.message.findMany({
            where: { conversationId, deletedAt: null },
            include: {
                user: { select: { id: true, name: true, avatarUrl: true } },
            },
            orderBy: { createdAt: 'asc' },
        });
    }
}
