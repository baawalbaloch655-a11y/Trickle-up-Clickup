import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTaskCommentDto, UpdateTaskCommentDto } from './dto/task-comment.dto';
import { RealtimeGateway } from '../../realtime/realtime.gateway';

@Injectable()
export class TaskCommentsService {
    constructor(
        private prisma: PrismaService,
        private realtimeGateway: RealtimeGateway,
    ) { }

    async create(orgId: string, taskId: string, userId: string, dto: CreateTaskCommentDto) {
        // Verify task exists in org
        const task = await this.prisma.task.findUnique({ where: { id: taskId } });
        if (!task || task.orgId !== orgId) throw new NotFoundException('Task not found');

        const comment = await this.prisma.taskComment.create({
            data: {
                content: dto.content,
                taskId,
                userId,
            },
            include: {
                user: { select: { id: true, name: true, avatarUrl: true } }
            }
        });

        // Broadcast comment creation via WebSocket
        this.realtimeGateway.emitToOrg(orgId, 'task_comment:created', { taskId, comment });

        return comment;
    }

    async findAll(orgId: string, taskId: string) {
        // Verify task
        const task = await this.prisma.task.findUnique({ where: { id: taskId } });
        if (!task || task.orgId !== orgId) throw new NotFoundException('Task not found');

        return this.prisma.taskComment.findMany({
            where: { taskId },
            include: {
                user: { select: { id: true, name: true, avatarUrl: true } }
            },
            orderBy: { createdAt: 'asc' }
        });
    }

    async update(orgId: string, id: string, userId: string, dto: UpdateTaskCommentDto) {
        const comment = await this.prisma.taskComment.findUnique({
            where: { id },
            include: { task: true, user: { select: { id: true, name: true, avatarUrl: true } } }
        });

        if (!comment || comment.task.orgId !== orgId) throw new NotFoundException('Comment not found');
        if (comment.userId !== userId) throw new UnauthorizedException('You can only edit your own comments');

        const updated = await this.prisma.taskComment.update({
            where: { id },
            data: { content: dto.content },
            include: { user: { select: { id: true, name: true, avatarUrl: true } } }
        });

        this.realtimeGateway.emitToOrg(orgId, 'task_comment:updated', { taskId: comment.taskId, comment: updated });

        return updated;
    }

    async remove(orgId: string, id: string, userId: string) {
        const comment = await this.prisma.taskComment.findUnique({
            where: { id },
            include: { task: true }
        });

        if (!comment || comment.task.orgId !== orgId) throw new NotFoundException('Comment not found');
        if (comment.userId !== userId) throw new UnauthorizedException('You can only delete your own comments');

        await this.prisma.taskComment.delete({ where: { id } });

        this.realtimeGateway.emitToOrg(orgId, 'task_comment:deleted', { taskId: comment.taskId, commentId: id });

        return { success: true };
    }
}
