import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditLogsService {
    constructor(private readonly prisma: PrismaService) { }

    async log(orgId: string, userId: string, action: any, resource: string, resourceId?: string, metadata?: any) {
        return this.prisma.auditLog.create({
            data: { orgId, userId, action, resource, resourceId, metadata }
        });
    }

    async getLogs(orgId: string) {
        return this.prisma.auditLog.findMany({
            where: { orgId },
            include: { user: { select: { name: true, email: true } } },
            orderBy: { createdAt: 'desc' },
            take: 100
        });
    }
}
