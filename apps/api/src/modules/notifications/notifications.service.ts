import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(userId: string, orgId: string, options?: { category?: string; isCleared?: boolean }) {
        return this.prisma.notification.findMany({
            where: {
                userId,
                orgId,
                category: options?.category as any,
                isCleared: options?.isCleared ?? false,
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }

    async getUnreadCount(userId: string, orgId: string) {
        const count = await this.prisma.notification.count({
            where: { userId, orgId, isRead: false, isCleared: false },
        });
        return { count };
    }

    async markRead(userId: string, notificationId: string) {
        return this.prisma.notification.updateMany({
            where: { id: notificationId, userId },
            data: { isRead: true },
        });
    }

    async markAllRead(userId: string, orgId: string) {
        return this.prisma.notification.updateMany({
            where: { userId, orgId, isRead: false, isCleared: false },
            data: { isRead: true },
        });
    }

    async clearNotification(userId: string, notificationId: string) {
        return this.prisma.notification.updateMany({
            where: { id: notificationId, userId },
            data: { isCleared: true, isRead: true },
        });
    }

    async clearAll(userId: string, orgId: string) {
        return this.prisma.notification.updateMany({
            where: { userId, orgId, isCleared: false },
            data: { isCleared: true, isRead: true },
        });
    }

    async updateCategory(userId: string, notificationId: string, category: string) {
        return this.prisma.notification.updateMany({
            where: { id: notificationId, userId },
            data: { category: category as any },
        });
    }

    async create(data: {
        userId: string;
        orgId: string;
        type: string;
        title: string;
        body: string;
        metadata?: Record<string, unknown>;
    }) {
        return this.prisma.notification.create({
            data: {
                userId: data.userId,
                orgId: data.orgId,
                type: data.type as any,
                category: this.autoCategorize(data.type),
                title: data.title,
                body: data.body,
                metadata: data.metadata as any,
            },
        });
    }

    private autoCategorize(type: string): any {
        const primaryTypes = ['MENTION', 'TASK_ASSIGNED', 'COMMENT_REPLY', 'COMMENT_ASSIGNED'];
        if (primaryTypes.includes(type)) return 'PRIMARY';
        return 'OTHER';
    }

    async deleteOld(userId: string) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        await this.prisma.notification.deleteMany({
            where: { userId, isRead: true, createdAt: { lt: thirtyDaysAgo } },
        });
    }
}
