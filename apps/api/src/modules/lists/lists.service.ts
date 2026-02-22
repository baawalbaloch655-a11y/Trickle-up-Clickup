import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateListDto, UpdateListDto } from './dto/list.dto';

@Injectable()
export class ListsService {
    constructor(private prisma: PrismaService) { }

    async create(orgId: string, dto: CreateListDto) {
        return this.prisma.list.create({
            data: {
                ...dto,
                name: dto.name,
                orgId: orgId,
            },
        });
    }

    async findAllByFolder(folderId: string) {
        return this.prisma.list.findMany({
            where: { folderId },
            include: {
                tasks: true,
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    async findAllBySpace(spaceId: string) {
        return this.prisma.list.findMany({
            where: { spaceId, folderId: null },
            include: {
                tasks: true,
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    async findOne(orgId: string, id: string) {
        const list = await this.prisma.list.findUnique({
            where: { id },
            include: {
                tasks: true,
            },
        });

        if (!list || list.orgId !== orgId) {
            throw new NotFoundException('List not found');
        }

        return list;
    }

    async update(orgId: string, id: string, dto: UpdateListDto) {
        await this.findOne(orgId, id); // verify access

        return this.prisma.list.update({
            where: { id },
            data: dto,
        });
    }

    async remove(orgId: string, id: string) {
        await this.findOne(orgId, id); // verify access

        return this.prisma.list.delete({
            where: { id },
        });
    }
}
