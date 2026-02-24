import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface SearchResult {
    id: string;
    type: 'TASK' | 'LIST' | 'CHANNEL' | 'MEMBER' | 'MESSAGE' | 'COMMAND';
    title: string;
    subtitle?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
}

@Injectable()
export class SearchService {
    constructor(private readonly prisma: PrismaService) { }

    async globalSearch(orgId: string, userId: string, query: string): Promise<SearchResult[]> {
        if (!query || query.length < 2) return [];

        const lowercaseQuery = query.toLowerCase();

        const [tasks, lists, channels, members, messages] = await Promise.all([
            this.searchTasks(orgId, query),
            this.searchLists(orgId, query),
            this.searchChannels(orgId, query),
            this.searchMembers(orgId, query),
            this.searchMessages(orgId, userId, query),
        ]);

        const results: SearchResult[] = [
            ...tasks,
            ...lists,
            ...channels,
            ...members,
            ...messages,
        ];

        // Sort by relevance (basic: contains query in title > subtitle) and then by date
        return results.sort((a, b) => {
            const aTitleMatch = a.title.toLowerCase().includes(lowercaseQuery);
            const bTitleMatch = b.title.toLowerCase().includes(lowercaseQuery);
            if (aTitleMatch && !bTitleMatch) return -1;
            if (!aTitleMatch && bTitleMatch) return 1;
            return b.createdAt.getTime() - a.createdAt.getTime();
        }).slice(0, 50);
    }

    private async searchTasks(orgId: string, query: string): Promise<SearchResult[]> {
        const tasks = await this.prisma.task.findMany({
            where: {
                orgId,
                deletedAt: null,
                OR: [
                    { title: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } },
                ],
            },
            include: { list: { select: { name: true } } },
            take: 15,
        });

        return tasks.map(t => ({
            id: t.id,
            type: 'TASK',
            title: t.title,
            subtitle: `in ${t.list.name}`,
            metadata: { listId: t.listId, status: t.status, priority: t.priority },
            createdAt: t.createdAt,
        }));
    }

    private async searchLists(orgId: string, query: string): Promise<SearchResult[]> {
        const lists = await this.prisma.list.findMany({
            where: {
                orgId,
                deletedAt: null,
                name: { contains: query, mode: 'insensitive' },
            },
            take: 10,
        });

        return lists.map(l => ({
            id: l.id,
            type: 'LIST',
            title: l.name,
            subtitle: 'List',
            metadata: { color: l.color },
            createdAt: l.createdAt,
        }));
    }

    private async searchChannels(orgId: string, query: string): Promise<SearchResult[]> {
        const channels = await this.prisma.channel.findMany({
            where: {
                orgId,
                deletedAt: null,
                name: { contains: query, mode: 'insensitive' },
            },
            take: 10,
        });

        return channels.map(c => ({
            id: c.id,
            type: 'CHANNEL',
            title: `# ${c.name}`,
            subtitle: 'Channel',
            metadata: { isPrivate: c.isPrivate },
            createdAt: c.createdAt,
        }));
    }

    private async searchMembers(orgId: string, query: string): Promise<SearchResult[]> {
        const members = await this.prisma.orgMember.findMany({
            where: {
                orgId,
                deletedAt: null,
                user: {
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { email: { contains: query, mode: 'insensitive' } },
                    ],
                },
            },
            include: { user: { select: { name: true, email: true, avatarUrl: true } } },
            take: 10,
        });

        return members.map(m => ({
            id: m.userId,
            type: 'MEMBER',
            title: m.user.name,
            subtitle: m.user.email,
            metadata: { avatarUrl: m.user.avatarUrl },
            createdAt: m.joinedAt,
        }));
    }

    private async searchMessages(orgId: string, userId: string, query: string): Promise<SearchResult[]> {
        // Only search in channels user is member of OR public channels OR conversations user is member of
        const messages = await this.prisma.message.findMany({
            where: {
                content: { contains: query, mode: 'insensitive' },
                deletedAt: null,
                OR: [
                    { channel: { orgId, isPrivate: false } },
                    { channel: { members: { some: { userId } } } },
                    { conversation: { members: { some: { userId } } } },
                ],
            },
            include: {
                user: { select: { name: true } },
                channel: { select: { name: true } },
                conversation: { select: { id: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 15,
        });

        return messages.map(m => ({
            id: m.id,
            type: 'MESSAGE',
            title: m.content,
            subtitle: `from ${m.user.name} in ${m.channel ? `#${m.channel.name}` : 'Direct Message'}`,
            metadata: {
                channelId: m.channelId,
                conversationId: m.conversationId,
                userId: m.userId,
            },
            createdAt: m.createdAt,
        }));
    }
}
