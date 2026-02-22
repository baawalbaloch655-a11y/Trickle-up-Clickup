import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateConversationDto } from './dto/conversation.dto';

@Injectable()
export class ConversationsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(orgId: string, userId: string, dto: CreateConversationDto) {
        const { userIds, isGroup, name } = dto;
        const allMemberIds = Array.from(new Set([...userIds, userId]));

        // For 1:1 DMs, check if already exists
        if (!isGroup && allMemberIds.length === 2) {
            const existing = await this.prisma.conversation.findFirst({
                where: {
                    orgId,
                    isGroup: false,
                    AND: [
                        { members: { some: { userId: allMemberIds[0] } } },
                        { members: { some: { userId: allMemberIds[1] } } },
                    ],
                },
                include: {
                    members: {
                        include: {
                            user: { select: { id: true, name: true, avatarUrl: true } },
                        },
                    },
                },
            });

            if (existing && existing.members.length === 2) {
                return existing;
            }
        }

        const conversation = await this.prisma.conversation.create({
            data: {
                orgId,
                isGroup: !!isGroup,
                name,
                members: {
                    create: allMemberIds.map((id) => ({
                        userId: id,
                    })),
                },
            },
            include: {
                members: {
                    include: {
                        user: { select: { id: true, name: true, avatarUrl: true } },
                    },
                },
            },
        });

        return conversation;
    }

    async findAll(orgId: string, userId: string) {
        return this.prisma.conversation.findMany({
            where: {
                orgId,
                members: { some: { userId } },
            },
            include: {
                members: {
                    include: {
                        user: { select: { id: true, name: true, avatarUrl: true } },
                    },
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    include: {
                        user: { select: { name: true } },
                    },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });
    }

    async findOne(orgId: string, id: string, userId: string) {
        const conversation = await this.prisma.conversation.findFirst({
            where: { id, orgId, members: { some: { userId } } },
            include: {
                members: {
                    include: {
                        user: { select: { id: true, name: true, avatarUrl: true } },
                    },
                },
            },
        });

        if (!conversation) throw new NotFoundException('Conversation not found');

        return conversation;
    }
}
