import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateChannelDto, UpdateChannelDto } from './dto/channel.dto';

@Injectable()
export class ChannelsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(orgId: string, userId: string, dto: CreateChannelDto) {
        const channel = await this.prisma.channel.create({
            data: {
                ...dto,
                orgId,
                members: {
                    create: {
                        userId,
                        role: 'ADMIN',
                    },
                },
            },
            include: {
                members: true,
            },
        });
        return channel;
    }

    async findAll(orgId: string, userId: string) {
        // Return public channels + private channels where the user is a member
        return this.prisma.channel.findMany({
            where: {
                orgId,
                deletedAt: null,
                OR: [
                    { isPrivate: false },
                    { members: { some: { userId } } },
                ],
            },
            include: {
                _count: { select: { members: true } },
            },
        });
    }

    async findOne(orgId: string, id: string, userId: string) {
        const channel = await this.prisma.channel.findFirst({
            where: { id, orgId, deletedAt: null },
            include: {
                members: {
                    include: {
                        user: { select: { id: true, name: true, avatarUrl: true } },
                    },
                },
            },
        });

        if (!channel) throw new NotFoundException('Channel not found');

        if (channel.isPrivate && !channel.members.some(m => m.userId === userId)) {
            throw new ForbiddenException('You do not have access to this channel');
        }

        return channel;
    }

    async join(orgId: string, id: string, userId: string) {
        const channel = await this.findOne(orgId, id, userId);
        if (channel.isPrivate) {
            throw new ForbiddenException('Private channels require an invitation');
        }

        return this.prisma.channelMember.upsert({
            where: {
                channelId_userId: {
                    channelId: id,
                    userId,
                },
            },
            update: {},
            create: {
                channelId: id,
                userId,
                role: 'MEMBER',
            },
        });
    }

    async leave(orgId: string, id: string, userId: string) {
        await this.prisma.channelMember.delete({
            where: {
                channelId_userId: {
                    channelId: id,
                    userId,
                },
            },
        });
    }
}
