import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto, MoveTaskDto } from './dto/task.dto';
import { AutomationsService } from '../automations/automations.service';
import { RealtimeGateway } from '../../realtime/realtime.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { SlackService } from '../integrations/slack.service';

@Injectable()
export class TasksService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly automationsService: AutomationsService,
        private readonly realtimeGateway: RealtimeGateway,
        private readonly notificationsService: NotificationsService,
        private readonly slackService: SlackService
    ) { }

    async create(orgId: string, listId: string, userId: string, dto: CreateTaskDto) {
        const maxOrder = await this.prisma.task.aggregate({
            where: { listId, orgId, deletedAt: null },
            _max: { order: true },
        });
        const order = (maxOrder._max.order ?? -1) + 1;

        let statusId = dto.statusId;
        if (!statusId) {
            const defaultStatus = await this.prisma.status.findFirst({
                where: { orgId, category: 'TODO' },
                orderBy: { order: 'asc' }
            });
            statusId = defaultStatus?.id || '';
        }

        const { status, ...restDto } = dto;

        const task = await this.prisma.task.create({
            data: {
                ...restDto,
                orgId,
                listId,
                creatorId: userId,
                order: dto.order ?? order,
                statusId,
                priority: (dto.priority as any) ?? 'MEDIUM',
                dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
                tags: dto.tags ? { connect: dto.tags.map(name => ({ orgId_name: { orgId, name } })) } : undefined,
            },
            include: {
                assignee: { select: { id: true, name: true, avatarUrl: true } },
                creator: { select: { id: true, name: true, avatarUrl: true } },
            },
        });

        this.realtimeGateway.notifyTaskCreated(orgId, listId, task.id, userId, task);

        // Notify Slack (simulate)
        this.slackService.sendMessage(orgId, `New task created: *${task.title}*`).catch(err => {
            console.error('Failed to send slack message:', err);
        });

        return task;
    }

    async findAll(orgId: string, listId: string) {
        return this.prisma.task.findMany({
            where: { orgId, listId, deletedAt: null },
            include: {
                assignee: { select: { id: true, name: true, avatarUrl: true } },
                creator: { select: { id: true, name: true, avatarUrl: true } },
                status: true,
                _count: { select: { TaskComment: true } },
                blockingTasks: { include: { waitingOnTask: { select: { id: true, title: true, priority: true, status: true } } } },
                waitingOnTasks: { include: { blockingTask: { select: { id: true, title: true, priority: true, status: true } } } },
                checklists: { include: { items: true } },
                subtasks: { include: { assignee: { select: { id: true, name: true, avatarUrl: true } }, status: true } },
            },
            orderBy: [{ status: { order: 'asc' } }, { order: 'asc' }],
        });
    }

    async findOne(orgId: string, taskId: string) {
        const task = await this.prisma.task.findFirst({
            where: { id: taskId, orgId, deletedAt: null },
            include: {
                assignee: { select: { id: true, name: true, avatarUrl: true } },
                creator: { select: { id: true, name: true, avatarUrl: true } },
                list: { select: { id: true, name: true, color: true } },
                status: true,
                blockingTasks: { include: { waitingOnTask: { select: { id: true, title: true, priority: true, status: true } } } },
                waitingOnTasks: { include: { blockingTask: { select: { id: true, title: true, priority: true, status: true } } } },
                checklists: { include: { items: true } },
                subtasks: { include: { assignee: { select: { id: true, name: true, avatarUrl: true } }, status: true } },
            },
        });
        if (!task) throw new NotFoundException('Task not found');
        return task;
    }

    async update(orgId: string, taskId: string, userId: string, dto: UpdateTaskDto) {
        const previousTask = await this.findOne(orgId, taskId);

        const { status, ...restDto } = dto;

        const updatedTask = await this.prisma.task.update({
            where: { id: taskId },
            data: {
                ...restDto,
                statusId: dto.statusId,
                priority: dto.priority as any,
                dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
                tags: dto.tags ? { set: [], connect: dto.tags.map(name => ({ orgId_name: { orgId, name } })) } : undefined,
            },
            include: {
                assignee: { select: { id: true, name: true, avatarUrl: true } },
            },
        });

        // Trigger Automation!
        if (dto.statusId && dto.statusId !== previousTask.statusId) {
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
            data: { statusId: dto.statusId, order: dto.order },
            include: { status: true },
        });

        // Trigger Automation!
        if (dto.statusId && dto.statusId !== previousTask.statusId) {
            await this.automationsService.evaluateTaskEvent(orgId, 'STATUS_CHANGE', task, previousTask);
        }

        // Notifications
        if (task.assigneeId && task.assigneeId !== userId && dto.statusId !== previousTask.statusId) {
            const notif = await this.notificationsService.create({
                userId: task.assigneeId,
                orgId,
                type: 'SYSTEM',
                title: 'Task Status Changed',
                body: `Task "${task.title}" was moved to ${task.status.name}`,
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

    async addDependency(orgId: string, taskId: string, dto: import('./dto/task.dto').AddDependencyDto) {
        await this.findOne(orgId, taskId);
        await this.findOne(orgId, dto.dependentTaskId);

        const blockingId = dto.type === 'BLOCKING' ? taskId : dto.dependentTaskId;
        const waitingOnId = dto.type === 'WAITING_ON' ? taskId : dto.dependentTaskId;

        return this.prisma.taskDependency.create({
            data: {
                blockingId,
                waitingOnId,
            }
        });
    }

    async removeDependency(orgId: string, taskId: string, dependencyId: string) {
        return this.prisma.taskDependency.delete({
            where: { id: dependencyId },
        });
    }

    async addChecklist(orgId: string, taskId: string, dto: import('./dto/task.dto').CreateChecklistDto) {
        await this.findOne(orgId, taskId);
        return this.prisma.checklist.create({
            data: { taskId, name: dto.name },
            include: { items: true },
        });
    }

    async removeChecklist(orgId: string, taskId: string, checklistId: string) {
        await this.findOne(orgId, taskId);
        return this.prisma.checklist.delete({ where: { id: checklistId } });
    }

    async addChecklistItem(orgId: string, taskId: string, checklistId: string, dto: import('./dto/task.dto').CreateChecklistItemDto) {
        await this.findOne(orgId, taskId);
        return this.prisma.checklistItem.create({
            data: { checklistId, name: dto.name, assigneeId: dto.assigneeId },
        });
    }

    async updateChecklistItem(orgId: string, taskId: string, checklistId: string, itemId: string, dto: import('./dto/task.dto').UpdateChecklistItemDto) {
        await this.findOne(orgId, taskId);
        return this.prisma.checklistItem.update({
            where: { id: itemId },
            data: {
                name: dto.name,
                isResolved: dto.isResolved,
                assigneeId: dto.assigneeId,
                order: dto.order,
            },
        });
    }

    async removeChecklistItem(orgId: string, taskId: string, checklistId: string, itemId: string) {
        await this.findOne(orgId, taskId);
        return this.prisma.checklistItem.delete({ where: { id: itemId } });
    }

    async getDashboardStats(orgId: string) {
        const [total, completed, inProgress, overdue, lists, members] = await Promise.all([
            this.prisma.task.count({ where: { orgId, deletedAt: null } }),
            this.prisma.task.count({ where: { orgId, deletedAt: null, status: { category: 'DONE' } } }),
            this.prisma.task.count({ where: { orgId, deletedAt: null, status: { category: 'IN_PROGRESS' } } }),
            this.prisma.task.count({ where: { orgId, deletedAt: null, dueDate: { lt: new Date() }, status: { category: { notIn: ['DONE', 'CANCELLED'] } } } }),
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
