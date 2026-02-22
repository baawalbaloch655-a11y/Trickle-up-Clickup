import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSpaceDto, UpdateSpaceDto } from './dto/space.dto';

@Injectable()
export class SpacesService {
    constructor(private prisma: PrismaService) { }

    async create(orgId: string, dto: CreateSpaceDto) {
        return this.prisma.space.create({
            data: {
                ...dto,
                orgId,
            },
        });
    }

    async findAll(orgId: string) {
        return this.prisma.space.findMany({
            where: { orgId },
            include: {
                folders: {
                    include: {
                        lists: true
                    }
                },
                lists: true,
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    async findOne(orgId: string, id: string) {
        const space = await this.prisma.space.findUnique({
            where: { id },
            include: {
                folders: {
                    include: {
                        lists: true
                    }
                },
                lists: true,
            },
        });

        if (!space || space.orgId !== orgId) {
            throw new NotFoundException('Space not found');
        }

        return space;
    }

    async update(orgId: string, id: string, dto: UpdateSpaceDto) {
        await this.findOne(orgId, id); // verify temp access

        return this.prisma.space.update({
            where: { id },
            data: dto,
        });
    }

    async remove(orgId: string, id: string) {
        await this.findOne(orgId, id); // verify access

        return this.prisma.space.delete({
            where: { id },
        });
    }
}
