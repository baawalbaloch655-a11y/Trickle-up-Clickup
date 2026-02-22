import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto, MoveTaskDto } from './dto/task.dto';
import { AutomationsService } from '../automations/automations.service';
import { RealtimeGateway } from '../../realtime/realtime.gateway';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TasksService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly automationsService: AutomationsService,
        private readonly realtimeGateway: RealtimeGateway,
        private readonly notificationsService: NotificationsService
    ) { }

    async create(orgId: string, listId: string, userId: string, dto: CreateTaskDto) {
        const maxOrder = await this.prisma.task.aggregate({
            where: { listId, orgId, deletedAt: null },
            _max: { order: true },
        });
        const order = (maxOrder._max.order ?? -1) + 1;

        const task = await this.prisma.task.create({
            data: {
                ...dto,
                orgId,
                listId,
                creatorId: userId,
                order: dto.order ?? order,
                status: (dto.status as any) ?? 'TODO',
                priority: (dto.priority as any) ?? 'MEDIUM',
                dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
                tags: dto.tags ?? [],
            },
            include: {
                assignee: { select: { id: true, name: true, avatarUrl: true } },
                creator: { select: { id: true, name: true, avatarUrl: true } },
            },
        });

        this.realtimeGateway.notifyTaskCreated(orgId, listId, task.id, userId, task);

        return task;
    }

    async findAll(orgId: string, listId: string) {
        return this.prisma.task.findMany({
            where: { orgId, listId, deletedAt: null },
            include: {
                assignee: { select: { id: true, name: true, avatarUrl: true } },
                creator: { select: { id: true, name: true, avatarUrl: true } },
                _count: { select: { TaskComment: true } },
            },
            orderBy: [{ status: 'asc' }, { order: 'asc' }],
        });
    }

    async findOne(orgId: string, taskId: string) {
        const task = await this.prisma.task.findFirst({
            where: { id: taskId, orgId, deletedAt: null },
            include: {
                assignee: { select: { id: true, name: true, avatarUrl: true } },
                creator: { select: { id: true, name: true, avatarUrl: true } },
                list: { select: { id: true, name: true, color: true } },
            },
        });
        if (!task) throw new NotFoundException('Task not found');
        return task;
    }

    async update(orgId: string, taskId: string, userId: string, dto: UpdateTaskDto) {
        const previousTask = await this.findOne(orgId, taskId);

        const updatedTask = await this.prisma.task.update({
            where: { id: taskId },
            data: {
                ...dto,
                status: dto.status as any,
                priority: dto.priority as any,
                dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
            },
            include: {
                assignee: { select: { id: true, name: true, avatarUrl: true } },
            },
        });

        // Trigger Automation!
        if (dto.status && dto.status !== previousTask.status) {
            await this.automationsService.evaluateTaskEvent(orgId, 'STATUS_CHANGE', updatedTask, previousTask);
        }

        // Notifications & Workload Recalculation
        if (dto.assigneeId && dto.assigneeId !== previousTask.assigneeId) {
            if (dto.assigneeId !== userId) {
                const notif = await this.notificationsService.create({
                    userId: dto.assigneeId,
                    orgId,
                    type: 'SYSTEM',
                    title: 'Assigned to a task',
                    body: `You were assigned to task: ${updatedTask.title}`,
                    metadata: { taskId: updatedTask.id, listId: updatedTask.listId }
                });
                this.realtimeGateway.notifyNewNotification(dto.assigneeId, notif);
            }

            // Realtime Employee Workload Event
            this.realtimeGateway.emitToOrg(orgId, 'employee.capacity_updated', {
                orgId, employeeId: dto.assigneeId, actorId: userId, timestamp: new Date().toISOString()
            });

            // If it was reassigned, broadcast for the previous assignee as well
            if (previousTask.assigneeId) {
                this.realtimeGateway.emitToOrg(orgId, 'employee.capacity_updated', {
                    orgId, employeeId: previousTask.assigneeId, actorId: userId, timestamp: new Date().toISOString()
                });
            }
        }

        this.realtimeGateway.notifyTaskUpdated(orgId, updatedTask.listId, updatedTask.id, userId, updatedTask);

        return updatedTask;
    }

    async move(orgId: string, taskId: string, userId: string, dto: MoveTaskDto) {
        const previousTask = await this.findOne(orgId, taskId);
        const task = await this.prisma.task.update({
            where: { id: taskId },
            data: { status: dto.status as any, order: dto.order },
        });

        // Trigger Automation!
        if (dto.status && dto.status !== previousTask.status) {
            await this.automationsService.evaluateTaskEvent(orgId, 'STATUS_CHANGE', task, previousTask);
        }

        // Notifications
        if (task.assigneeId && task.assigneeId !== userId && dto.status !== previousTask.status) {
            const notif = await this.notificationsService.create({
                userId: task.assigneeId,
                orgId,
                type: 'SYSTEM',
                title: 'Task Status Changed',
                body: `Task "${task.title}" was moved to ${task.status}`,
                metadata: { taskId: task.id, listId: task.listId }
            });
            this.realtimeGateway.notifyNewNotification(task.assigneeId, notif);
        }

        this.realtimeGateway.notifyTaskUpdated(orgId, task.listId, task.id, userId, task);
        return task;
    }

    async remove(orgId: string, taskId: string, userId: string) {
        const task = await this.findOne(orgId, taskId);
        const deletedTask = await this.prisma.task.update({
            where: { id: taskId },
            data: { deletedAt: new Date() },
        });
        this.realtimeGateway.notifyTaskDeleted(orgId, task.listId, taskId, userId);
        return deletedTask;
    }

    async getDashboardStats(orgId: string) {
        const [total, completed, inProgress, overdue, lists, members] = await Promise.all([
            this.prisma.task.count({ where: { orgId, deletedAt: null } }),
            this.prisma.task.count({ where: { orgId, deletedAt: null, status: 'DONE' } }),
            this.prisma.task.count({ where: { orgId, deletedAt: null, status: 'IN_PROGRESS' } }),
            this.prisma.task.count({ where: { orgId, deletedAt: null, dueDate: { lt: new Date() }, status: { not: 'DONE' } } }),
            this.prisma.list.count({ where: { orgId, deletedAt: null } }),
            this.prisma.orgMember.count({ where: { orgId, deletedAt: null } }),
        ]);
        return {
            totalTasks: total,
            completedTasks: completed,
            inProgressTasks: inProgress,
            overdueTask: overdue,
            totalLists: lists,
            activeMembers: members,
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
    }
}
