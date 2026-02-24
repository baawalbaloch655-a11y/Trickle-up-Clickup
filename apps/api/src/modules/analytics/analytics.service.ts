import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TasksService } from '../tasks/tasks.service';

@Injectable()
export class AnalyticsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly tasksService: TasksService,
    ) { }

    async getDashboard(orgId: string) {
        const stats = await this.tasksService.getDashboardStats(orgId);
        const recentActivity = await this.prisma.auditLog.findMany({
            where: { orgId },
            include: { user: { select: { id: true, name: true, avatarUrl: true } } },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
        return { ...stats, recentActivity };
    }

    async getHomeData(userId: string, orgId: string) {
        // 1. Recents: Recently viewed or interacted tasks/lists
        const recents = await this.prisma.auditLog.findMany({
            where: { userId, orgId, action: { in: ['VIEW', 'CREATE', 'UPDATE'] } },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });

        // 2. Agenda: Tasks assigned to user due today or overdue
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        const agenda = await this.prisma.task.findMany({
            where: {
                assigneeId: userId,
                orgId,
                status: { notIn: ['DONE', 'CANCELLED'] },
                dueDate: { lte: today },
            },
            include: { list: true },
            orderBy: { dueDate: 'asc' },
            take: 10,
        });

        // 3. My Work: Breakdown
        const myTasks = await this.prisma.task.findMany({
            where: { assigneeId: userId, orgId },
            orderBy: { updatedAt: 'desc' },
        });

        const myWork = {
            todo: myTasks.filter(t => ['TODO', 'IN_PROGRESS', 'IN_REVIEW'].includes(t.status)),
            done: myTasks.filter(t => t.status === 'DONE'),
            delegated: await this.prisma.task.findMany({
                where: { creatorId: userId, orgId, assigneeId: { not: userId } },
                take: 10,
            })
        };

        // 4. Assigned to me (full list for the table)
        const assignedToMe = myTasks.filter(t => t.status !== 'DONE');

        // 5. Personal List: Tasks from a list named "Personal List"
        const personalList = await this.prisma.list.findFirst({
            where: { orgId, name: { contains: 'Personal', mode: 'insensitive' } },
            include: { tasks: { where: { deletedAt: null }, take: 5, orderBy: { createdAt: 'desc' } } }
        });

        // 6. Assigned Comments: Notifications of type COMMENT_ASSIGNED
        const assignedComments = await this.prisma.notification.findMany({
            where: { userId, orgId, type: 'COMMENT_ASSIGNED', isCleared: false },
            orderBy: { createdAt: 'desc' },
            take: 5,
        });

        return {
            recents,
            agenda,
            myWork,
            assignedToMe,
            personalList: personalList?.tasks || [],
            assignedComments,
        };
    }

    async trackView(userId: string, orgId: string, resource: string, resourceId: string) {
        return this.prisma.auditLog.create({
            data: {
                userId,
                orgId,
                action: 'VIEW',
                resource,
                resourceId,
            }
        });
    }

    async getTasksByStatus(orgId: string) {
        const statuses = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED'];
        const results = await Promise.all(
            statuses.map(async (status) => ({
                status,
                count: await this.prisma.task.count({ where: { orgId, status: status as any, deletedAt: null } }),
            })),
        );
        return results;
    }

    async getTasksByPriority(orgId: string) {
        const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
        return Promise.all(
            priorities.map(async (priority) => ({
                priority,
                count: await this.prisma.task.count({ where: { orgId, priority: priority as any, deletedAt: null } }),
            })),
        );
    }

    async getTasksByList(orgId: string) {
        const lists = await this.prisma.list.findMany({
            where: { orgId, deletedAt: null },
            include: {
                _count: { select: { tasks: { where: { deletedAt: null } } } },
                tasks: {
                    where: { deletedAt: null },
                    select: { id: true, title: true, status: true, priority: true, dueDate: true, assigneeId: true },
                    take: 20,
                },
            },
            take: 12,
        });
        return lists.map(l => ({
            id: l.id,
            name: l.name,
            total: l._count.tasks,
            tasks: l.tasks,
            done: l.tasks.filter(t => t.status === 'DONE').length,
            inProgress: l.tasks.filter(t => t.status === 'IN_PROGRESS').length,
            todo: l.tasks.filter(t => t.status === 'TODO').length,
        }));
    }

    async getTasksByAssignee(orgId: string) {
        const users = await this.prisma.user.findMany({
            where: { orgMembers: { some: { orgId } } },
            select: { id: true, name: true, avatarUrl: true },
            take: 20,
        });
        const results = await Promise.all(
            users.map(async (u) => ({
                userId: u.id,
                name: u.name,
                avatarUrl: u.avatarUrl,
                total: await this.prisma.task.count({ where: { orgId, assigneeId: u.id, deletedAt: null } }),
                done: await this.prisma.task.count({ where: { orgId, assigneeId: u.id, deletedAt: null, status: 'DONE' } }),
                overdue: await this.prisma.task.count({
                    where: { orgId, assigneeId: u.id, deletedAt: null, status: { notIn: ['DONE', 'CANCELLED'] }, dueDate: { lt: new Date() } },
                }),
            }))
        );
        return results.filter(r => r.total > 0);
    }

    async getActivityFeed(orgId: string, take = 50) {
        return this.prisma.auditLog.findMany({
            where: { orgId },
            include: { user: { select: { id: true, name: true, avatarUrl: true } } },
            orderBy: { createdAt: 'desc' },
            take,
        });
    }

    async getHealthMetrics() {
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            nodeVersion: process.version,
        };
    }
}
