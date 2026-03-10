import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGoalDto, UpdateGoalDto, CreateGoalTargetDto, UpdateGoalTargetDto } from './dto/goal.dto';

@Injectable()
export class GoalsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(orgId: string, userId: string, dto: CreateGoalDto) {
        return this.prisma.goal.create({
            data: {
                orgId,
                ownerId: userId,
                name: dto.name,
                description: dto.description,
                color: dto.color,
                endDate: dto.endDate ? new Date(dto.endDate) : null,
                isPrivate: dto.isPrivate || false,
            },
            include: { targets: true }
        });
    }

    async findAll(orgId: string, userId: string) {
        return this.prisma.goal.findMany({
            where: {
                orgId,
                OR: [
                    { isPrivate: false },
                    { ownerId: userId }
                ]
            },
            include: {
                owner: { select: { id: true, name: true, avatarUrl: true } },
                targets: true
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findOne(orgId: string, userId: string, goalId: string) {
        const goal = await this.prisma.goal.findFirst({
            where: { id: goalId, orgId },
            include: {
                owner: { select: { id: true, name: true, avatarUrl: true } },
                targets: true
            }
        });
        if (!goal) throw new NotFoundException('Goal not found');
        if (goal.isPrivate && goal.ownerId !== userId) {
            throw new NotFoundException('Goal not found');
        }
        return goal;
    }

    async update(orgId: string, userId: string, goalId: string, dto: UpdateGoalDto) {
        const goal = await this.findOne(orgId, userId, goalId);
        return this.prisma.goal.update({
            where: { id: goal.id },
            data: {
                ...dto,
                endDate: dto.endDate ? new Date(dto.endDate) : undefined,
            },
            include: { targets: true }
        });
    }

    async remove(orgId: string, userId: string, goalId: string) {
        const goal = await this.findOne(orgId, userId, goalId);
        await this.prisma.goal.delete({ where: { id: goal.id } });
    }

    // Targets
    async addTarget(orgId: string, userId: string, goalId: string, dto: CreateGoalTargetDto) {
        const goal = await this.findOne(orgId, userId, goalId);
        return this.prisma.goalTarget.create({
            data: {
                goalId: goal.id,
                name: dto.name,
                type: dto.type as any || 'NUMBER',
                targetValue: dto.targetValue,
                currentValue: dto.currentValue || 0,
                unit: dto.unit
            }
        });
    }

    async updateTarget(orgId: string, userId: string, goalId: string, targetId: string, dto: UpdateGoalTargetDto) {
        const goal = await this.findOne(orgId, userId, goalId);
        const target = await this.prisma.goalTarget.findFirst({ where: { id: targetId, goalId: goal.id } });
        if (!target) throw new NotFoundException('Target not found');

        return this.prisma.goalTarget.update({
            where: { id: target.id },
            data: dto
        });
    }

    async removeTarget(orgId: string, userId: string, goalId: string, targetId: string) {
        const goal = await this.findOne(orgId, userId, goalId);
        const target = await this.prisma.goalTarget.findFirst({ where: { id: targetId, goalId: goal.id } });
        if (!target) throw new NotFoundException('Target not found');

        await this.prisma.goalTarget.delete({ where: { id: target.id } });
    }
}
