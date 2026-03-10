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
                status: { category: { notIn: ['DONE', 'CANCELLED'] } },
                dueDate: { lte: today },
            },
            include: { list: true, status: true },
            orderBy: { dueDate: 'asc' },
            take: 10,
        });

        // 3. My Work: Breakdown
        const myTasks = await this.prisma.task.findMany({
            where: { assigneeId: userId, orgId },
            include: { status: true, list: { select: { name: true } } },
            orderBy: { updatedAt: 'desc' },
        });

        const myWork = {
            todo: myTasks.filter(t => ['TODO', 'IN_PROGRESS'].includes(t.status.category)),
            done: myTasks.filter(t => t.status.category === 'DONE'),
            delegated: await this.prisma.task.findMany({
                where: { creatorId: userId, orgId, assigneeId: { not: userId } },
                include: { status: true, list: { select: { name: true } } },
                take: 10,
            })
        };

        // 4. Assigned to me (full list for the table)
        const assignedToMe = myTasks.filter(t => t.status.category !== 'DONE');

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
        const statuses = ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'];
        const results = await Promise.all(
            statuses.map(async (category) => ({
                status: category,
                count: await this.prisma.task.count({ where: { orgId, status: { category }, deletedAt: null } }),
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

    async getTasksForPriority(orgId: string, priority: string) {
        const tasks = await this.prisma.task.findMany({
            where: { orgId, priority: priority.toUpperCase() as any, deletedAt: null },
            select: {
                id: true,
                title: true,
                priority: true,
                dueDate: true,
                status: { select: { id: true, name: true, category: true, color: true } },
                assignee: { select: { id: true, name: true, avatarUrl: true } },
                list: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
        return tasks;
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
            done: l.tasks.filter(t => (t.status as any).category === 'DONE').length,
            inProgress: l.tasks.filter(t => (t.status as any).category === 'IN_PROGRESS').length,
            todo: l.tasks.filter(t => (t.status as any).category === 'TODO').length,
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
                done: await this.prisma.task.count({ where: { orgId, assigneeId: u.id, deletedAt: null, status: { category: 'DONE' } } }),
                overdue: await this.prisma.task.count({
                    where: { orgId, assigneeId: u.id, deletedAt: null, status: { category: { notIn: ['DONE', 'CANCELLED'] } }, dueDate: { lt: new Date() } },
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

    async getTimeTrackingSummary(orgId: string, userId?: string, startDate?: Date, endDate?: Date) {
        console.log(`[AnalyticsService] getTimeTrackingSummary for orgId: ${orgId}, userId: ${userId}`);
        const where: any = {
            task: { orgId }
        };

        if (userId) {
            where.userId = userId;
        }

        if (startDate || endDate) {
            where.startTime = {};
            if (startDate) where.startTime.gte = startDate;
            if (endDate) where.startTime.lte = endDate;
        }

        const entries = await this.prisma.timeEntry.findMany({
            where,
            include: {
                task: { select: { id: true, title: true, list: { select: { id: true, name: true } } } },
                user: { select: { id: true, name: true, avatarUrl: true } }
            },
            orderBy: { startTime: 'desc' }
        });

        // Aggregate by day for charts (TimeEntry only)
        const dailyStats = entries.reduce((acc: any, entry) => {
            const date = entry.startTime.toISOString().split('T')[0];
            if (!acc[date]) acc[date] = 0;
            acc[date] += entry.duration || 0;
            return acc;
        }, {});

        // Aggregate by project/list (Hybrid: TimeEntry + fallback to Task.timeTracked if empty)
        const listStats: { [key: string]: number } = {};

        // Add TimeEntry contributions
        entries.forEach(entry => {
            const listName = entry.task?.list?.name || 'Uncategorized';
            if (!listStats[listName]) listStats[listName] = 0;
            listStats[listName] += (entry.duration || 0);
        });

        // Fallback/Supplement with Task.timeTracked for the doughnut chart if no entries in period
        // OR just always include them for an 'Overall' view if no date filter
        if (entries.length === 0) {
            const tasksWithTime = await this.prisma.task.findMany({
                where: { orgId, timeTracked: { gt: 0 }, deletedAt: null },
                include: { list: { select: { name: true } } }
            });
            tasksWithTime.forEach(task => {
                const listName = task.list?.name || 'Uncategorized';
                if (!listStats[listName]) listStats[listName] = 0;
                listStats[listName] += (task.timeTracked || 0);
            });
        }

        const totalTrackedSecondsCalculated = Object.values(listStats).reduce((a, b) => a + b, 0);

        return {
            entries,
            dailyStats: Object.entries(dailyStats).map(([date, seconds]) => ({ date, hours: (seconds as number) / 3600 })),
            listStats: Object.entries(listStats).map(([name, seconds]) => ({ name, hours: (seconds as number) / 3600 })),
            totalHours: totalTrackedSecondsCalculated / 3600,
            count: entries.length,
            _debug: {
                orgId,
                userId,
                queryWhere: where,
                totalEntriesInDb: await this.prisma.timeEntry.count(),
                totalEntriesForOrg: await this.prisma.timeEntry.count({ where: { task: { orgId } } }),
                legacyTaskCount: entries.length === 0 ? await this.prisma.task.count({ where: { orgId, timeTracked: { gt: 0 } } }) : 0
            }
        };
    }

    async getProductivityMetrics(orgId: string) {
        // Compare estimates vs actual time using Task.timeTracked (legacy/cumulative)
        const tasks = await this.prisma.task.findMany({
            where: {
                orgId,
                deletedAt: null,
                OR: [
                    { timeEstimate: { gt: 0 } },
                    { timeTracked: { gt: 0 } }
                ]
            },
            select: {
                id: true,
                title: true,
                timeEstimate: true,
                timeTracked: true
            },
            take: 50
        });

        return tasks.map(task => {
            const estimateSeconds = (task.timeEstimate || 0) * 60; // timeEstimate is in minutes
            const actualSeconds = (task.timeTracked || 0); // timeTracked is in seconds

            return {
                id: task.id,
                title: task.title,
                estimateHours: estimateSeconds / 3600,
                actualHours: actualSeconds / 3600,
                variance: estimateSeconds - actualSeconds
            };
        });
    }
}
