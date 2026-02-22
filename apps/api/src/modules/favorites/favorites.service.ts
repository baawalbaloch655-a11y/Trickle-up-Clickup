import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FavoriteType } from '@prisma/client';
import { ToggleFavoriteDto } from './dto/favorite.dto';

@Injectable()
export class FavoritesService {
    constructor(private readonly prisma: PrismaService) { }

    async toggle(userId: string, orgId: string, dto: ToggleFavoriteDto) {
        const { entityType, entityId } = dto;

        // Verify entity exists
        await this.verifyEntityExists(orgId, entityType, entityId);

        const existing = await this.prisma.favorite.findUnique({
            where: {
                userId_entityType_entityId: {
                    userId,
                    entityType,
                    entityId,
                },
            },
        });

        if (existing) {
            await this.prisma.favorite.delete({
                where: { id: existing.id },
            });
            return { favorited: false };
        }

        await this.prisma.favorite.create({
            data: {
                userId,
                orgId,
                entityType,
                entityId,
            },
        });

        return { favorited: true };
    }

    async findAll(userId: string, orgId: string) {
        return this.prisma.favorite.findMany({
            where: { userId, orgId },
            orderBy: { createdAt: 'desc' },
        });
    }

    private async verifyEntityExists(orgId: string, type: FavoriteType, id: string) {
        let exists = false;
        switch (type) {
            case FavoriteType.SPACE:
                exists = !!(await this.prisma.space.findFirst({ where: { id, orgId } }));
                break;
            case FavoriteType.FOLDER:
                exists = !!(await this.prisma.folder.findFirst({ where: { id, orgId } }));
                break;
            case FavoriteType.LIST:
                exists = !!(await this.prisma.list.findFirst({ where: { id, orgId } }));
                break;
            case FavoriteType.TASK:
                exists = !!(await this.prisma.task.findFirst({ where: { id, orgId } }));
                break;
        }

        if (!exists) {
            throw new NotFoundException(`${type} not found`);
        }
    }
}
