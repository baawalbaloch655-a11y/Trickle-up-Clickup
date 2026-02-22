import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDepartmentDto, CreateTeamDto } from './dto/department.dto';

@Injectable()
export class DepartmentsService {
    constructor(private readonly prisma: PrismaService) { }

    async findAllDepartments(orgId: string) {
        return this.prisma.department.findMany({
            where: { orgId },
            include: { teams: true, members: { select: { id: true, title: true, user: { select: { name: true, avatarUrl: true } } } } },
            orderBy: { name: 'asc' }
        });
    }

    async createDepartment(orgId: string, dto: CreateDepartmentDto) {
        return this.prisma.department.create({
            data: { orgId, name: dto.name, description: dto.description }
        });
    }

    async createTeam(orgId: string, departmentId: string, dto: CreateTeamDto) {
        const dept = await this.prisma.department.findFirst({ where: { id: departmentId, orgId } });
        if (!dept) throw new NotFoundException('Department not found');

        return this.prisma.team.create({
            data: { departmentId, name: dto.name, description: dto.description }
        });
    }
}
