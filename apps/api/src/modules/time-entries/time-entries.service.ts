import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTimeEntryDto, UpdateTimeEntryDto } from './dto/time-entry.dto';

@Injectable()
export class TimeEntriesService {
    constructor(private prisma: PrismaService) { }

    async startTimer(userId: string, dto: CreateTimeEntryDto) {
        // Stop any running timer first
        const running = await this.prisma.timeEntry.findFirst({
            where: { userId, endTime: null },
        });

        if (running) {
            await this.stopTimer(userId, running.id);
        }

        return this.prisma.timeEntry.create({
            data: {
                userId,
                taskId: dto.taskId,
                description: dto.description,
                duration: dto.duration, // Optional manual duration
                endTime: dto.duration ? new Date() : null, // If manual duration, timer is "done"
            },
        });
    }

    async stopTimer(userId: string, entryId: string) {
        const entry = await this.prisma.timeEntry.findUnique({ where: { id: entryId } });
        if (!entry || entry.userId !== userId) throw new NotFoundException('Time entry not found');
        if (entry.endTime) throw new BadRequestException('Timer already stopped');

        const endTime = new Date();
        const durationSecs = Math.floor((endTime.getTime() - entry.startTime.getTime()) / 1000);

        return this.prisma.timeEntry.update({
            where: { id: entryId },
            data: {
                endTime,
                duration: durationSecs,
            },
        });
    }

    async getTaskTime(taskId: string) {
        return this.prisma.timeEntry.findMany({
            where: { taskId },
            orderBy: { startTime: 'desc' },
            include: { user: { select: { id: true, name: true, avatarUrl: true } } }
        });
    }

    async update(userId: string, id: string, dto: UpdateTimeEntryDto) {
        const entry = await this.prisma.timeEntry.findUnique({ where: { id } });
        if (!entry || entry.userId !== userId) throw new NotFoundException('Entry not found');

        return this.prisma.timeEntry.update({
            where: { id },
            data: dto,
        });
    }

    async remove(userId: string, id: string) {
        const entry = await this.prisma.timeEntry.findUnique({ where: { id } });
        if (!entry || entry.userId !== userId) throw new NotFoundException('Entry not found');

        return this.prisma.timeEntry.delete({
            where: { id },
        });
    }
}
