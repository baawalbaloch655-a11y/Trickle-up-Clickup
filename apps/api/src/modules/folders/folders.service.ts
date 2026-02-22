import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFolderDto, UpdateFolderDto } from './dto/folder.dto';

@Injectable()
export class FoldersService {
    constructor(private prisma: PrismaService) { }

    async create(orgId: string, spaceId: string, dto: CreateFolderDto) {
        return this.prisma.folder.create({
            data: {
                ...dto,
                name: dto.name,
                spaceId: spaceId,
                orgId: orgId,
            },
        });
    }

    async findAllBySpace(spaceId: string) {
        return this.prisma.folder.findMany({
            where: { spaceId },
            include: {
                lists: true,
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    async findOne(orgId: string, id: string) {
        const folder = await this.prisma.folder.findUnique({
            where: { id },
            include: {
                lists: true,
            },
        });

        if (!folder || folder.orgId !== orgId) {
            throw new NotFoundException('Folder not found');
        }

        return folder;
    }

    async update(orgId: string, id: string, dto: UpdateFolderDto) {
        await this.findOne(orgId, id); // verify access

        return this.prisma.folder.update({
            where: { id },
            data: dto,
        });
    }

    async remove(orgId: string, id: string) {
        await this.findOne(orgId, id); // verify access

        return this.prisma.folder.delete({
            where: { id },
        });
    }
}
