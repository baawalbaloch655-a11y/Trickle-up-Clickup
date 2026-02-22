import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeGateway } from '../../realtime/realtime.gateway';
import { UpdateEmployeeDto } from './dto/employee.dto';

@Injectable()
export class EmployeesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly realtimeGateway: RealtimeGateway,
    ) { }

    async findAll(orgId: string) {
        return this.prisma.orgMember.findMany({
            where: { orgId, deletedAt: null },
            include: {
                user: { select: { id: true, name: true, email: true, avatarUrl: true, status: true } },
                role: { select: { id: true, name: true } },
                department: { select: { id: true, name: true } },
                team: { select: { id: true, name: true } },
                manager: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
                skills: true,
            },
            orderBy: { joinedAt: 'desc' }
        });
    }

    async findOne(orgId: string, memberId: string) {
        const member = await this.prisma.orgMember.findFirst({
            where: { id: memberId, orgId, deletedAt: null },
            include: {
                user: { select: { id: true, name: true, email: true, avatarUrl: true, status: true } },
                role: { select: { id: true, name: true } },
                department: { select: { id: true, name: true } },
                team: { select: { id: true, name: true } },
                manager: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
                subordinates: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
                skills: true,
            }
        });

        if (!member) throw new NotFoundException('Employee not found');
        return member;
    }

    async update(orgId: string, memberId: string, actorId: string, dto: UpdateEmployeeDto) {
        const member = await this.findOne(orgId, memberId);

        const updated = await this.prisma.orgMember.update({
            where: { id: memberId },
            data: dto,
            include: { user: { select: { id: true, name: true, avatarUrl: true } } }
        });

        if (dto.status && dto.status !== member.status) {
            this.realtimeGateway.emitToOrg(orgId, 'employee.status_changed', { orgId, employeeId: memberId, actorId, timestamp: new Date().toISOString(), status: updated.status });
        }

        this.realtimeGateway.emitToOrg(orgId, 'employee.updated', { orgId, employeeId: memberId, actorId, timestamp: new Date().toISOString(), employee: updated });

        return updated;
    }

    async remove(orgId: string, memberId: string, actorId: string) {
        const member = await this.findOne(orgId, memberId);

        await this.prisma.orgMember.update({
            where: { id: memberId },
            data: { deletedAt: new Date(), status: 'INACTIVE' }
        });

        this.realtimeGateway.emitToOrg(orgId, 'employee.deleted', { orgId, employeeId: memberId, actorId, timestamp: new Date().toISOString() });

        return { success: true };
    }
}
