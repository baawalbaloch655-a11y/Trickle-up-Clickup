import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/auth.decorators';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly prisma: PrismaService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
            PERMISSIONS_KEY,
            [context.getHandler(), context.getClass()],
        );
        if (!requiredPermissions || requiredPermissions.length === 0) return true;

        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const orgId = request.headers['x-org-id'] || user?.orgId;

        if (!orgId) return true; // No org scope, skip

        const member = await this.prisma.orgMember.findUnique({
            where: { userId_orgId: { userId: user.id, orgId } },
            include: { role: true },
        });

        if (!member) {
            throw new ForbiddenException('Not a member of this organization');
        }

        const hasPermission = requiredPermissions.every((p) =>
            member.role.permissions.includes(p) || member.role.permissions.includes('*'),
        );

        if (!hasPermission) {
            throw new ForbiddenException(
                `Missing required permissions: ${requiredPermissions.join(', ')}`,
            );
        }

        // Attach member role to request
        request.user.rolePermissions = member.role.permissions;
        request.user.activeOrgId = orgId;
        return true;
    }
}
