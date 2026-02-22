import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) { }

    async findById(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id, deletedAt: null },
            select: {
                id: true, email: true, name: true, avatarUrl: true,
                status: true, isEmailVerified: true, createdAt: true,
            },
        });
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async updateProfile(id: string, dto: { name?: string; avatarUrl?: string }) {
        return this.prisma.user.update({
            where: { id },
            data: dto,
            select: {
                id: true, email: true, name: true, avatarUrl: true,
                status: true, isEmailVerified: true, updatedAt: true,
            },
        });
    }

    async searchOrgMembers(orgId: string, query: string) {
        return this.prisma.orgMember.findMany({
            where: {
                orgId,
                deletedAt: null,
                user: {
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { email: { contains: query, mode: 'insensitive' } },
                    ],
                },
            },
            include: {
                user: { select: { id: true, name: true, email: true, avatarUrl: true } },
                role: { select: { id: true, name: true } },
            },
            take: 20,
        });
    }
}
