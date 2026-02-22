import {
    Injectable,
    NotFoundException,
    ConflictException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrganizationDto, UpdateOrganizationDto, InviteMemberDto, UpdateMemberRoleDto } from './dto/organization.dto';

const DEFAULT_PERMISSIONS = {
    OWNER: ['*'],
    ADMIN: ['org:read', 'org:write', 'members:read', 'members:write', 'projects:read', 'projects:write', 'tasks:read', 'tasks:write', 'files:read', 'files:write'],
    MEMBER: ['org:read', 'members:read', 'projects:read', 'tasks:read', 'tasks:write', 'files:read'],
    VIEWER: ['org:read', 'projects:read', 'tasks:read'],
};

@Injectable()
export class OrganizationsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(userId: string, dto: CreateOrganizationDto) {
        const existing = await this.prisma.organization.findUnique({
            where: { slug: dto.slug },
        });
        if (existing) {
            throw new ConflictException('An organization with this slug already exists');
        }

        // Create org with default roles in a transaction
        const org = await this.prisma.$transaction(async (tx) => {
            const organization = await tx.organization.create({
                data: { name: dto.name, slug: dto.slug, logoUrl: dto.logoUrl },
            });

            // Create default system roles
            const ownerRole = await tx.role.create({
                data: {
                    orgId: organization.id,
                    name: 'Owner',
                    permissions: DEFAULT_PERMISSIONS.OWNER,
                    isDefault: false,
                    isSystem: true,
                },
            });
            await tx.role.createMany({
                data: [
                    { orgId: organization.id, name: 'Admin', permissions: DEFAULT_PERMISSIONS.ADMIN, isSystem: true },
                    { orgId: organization.id, name: 'Member', permissions: DEFAULT_PERMISSIONS.MEMBER, isDefault: true, isSystem: true },
                    { orgId: organization.id, name: 'Viewer', permissions: DEFAULT_PERMISSIONS.VIEWER, isSystem: true },
                ],
            });

            // Add creator as Owner
            await tx.orgMember.create({
                data: { userId, orgId: organization.id, roleId: ownerRole.id },
            });

            return organization;
        });

        return this.findOne(org.id);
    }

    async findAll(userId: string) {
        const memberships = await this.prisma.orgMember.findMany({
            where: { userId, deletedAt: null },
            include: {
                org: true,
                role: { select: { id: true, name: true, permissions: true } },
            },
        });
        return memberships;
    }

    async findOne(orgId: string) {
        const org = await this.prisma.organization.findUnique({
            where: { id: orgId, deletedAt: null },
            include: {
                _count: { select: { members: true, lists: true } },
                roles: { select: { id: true, name: true, permissions: true, isDefault: true, isSystem: true } },
            },
        });
        if (!org) throw new NotFoundException('Organization not found');
        return org;
    }

    async update(orgId: string, dto: UpdateOrganizationDto) {
        await this.findOne(orgId);
        return this.prisma.organization.update({
            where: { id: orgId },
            data: dto,
        });
    }

    async getMembers(orgId: string) {
        return this.prisma.orgMember.findMany({
            where: { orgId, deletedAt: null },
            include: {
                user: { select: { id: true, name: true, email: true, avatarUrl: true, status: true } },
                role: { select: { id: true, name: true, permissions: true } },
            },
            orderBy: { joinedAt: 'asc' },
        });
    }

    async inviteMember(orgId: string, dto: InviteMemberDto) {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!user) throw new NotFoundException(`No user found with email: ${dto.email}`);

        const existing = await this.prisma.orgMember.findUnique({
            where: { userId_orgId: { userId: user.id, orgId } },
        });
        if (existing && !existing.deletedAt) {
            throw new ConflictException('User is already a member of this organization');
        }

        const role = await this.prisma.role.findFirst({ where: { id: dto.roleId, orgId } });
        if (!role) throw new NotFoundException('Role not found');

        if (existing) {
            return this.prisma.orgMember.update({
                where: { id: existing.id },
                data: { roleId: dto.roleId, deletedAt: null },
                include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } }, role: true },
            });
        }

        return this.prisma.orgMember.create({
            data: { userId: user.id, orgId, roleId: dto.roleId },
            include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } }, role: true },
        });
    }

    async removeMember(orgId: string, memberId: string, requesterId: string) {
        const member = await this.prisma.orgMember.findFirst({
            where: { id: memberId, orgId },
            include: { role: true },
        });
        if (!member) throw new NotFoundException('Member not found');
        if (member.userId === requesterId) throw new BadRequestException('Cannot remove yourself');
        if (member.role.name === 'Owner') throw new ForbiddenException('Cannot remove the organization owner');

        return this.prisma.orgMember.update({
            where: { id: memberId },
            data: { deletedAt: new Date() },
        });
    }

    async updateMemberRole(orgId: string, memberId: string, dto: UpdateMemberRoleDto) {
        const role = await this.prisma.role.findFirst({ where: { id: dto.roleId, orgId } });
        if (!role) throw new NotFoundException('Role not found');

        return this.prisma.orgMember.update({
            where: { id: memberId },
            data: { roleId: dto.roleId },
            include: { user: { select: { id: true, name: true, email: true } }, role: true },
        });
    }
}
