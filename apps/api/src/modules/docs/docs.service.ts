import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDocumentDto, UpdateDocumentDto } from './dto/doc.dto';

@Injectable()
export class DocsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(orgId: string, userId: string, dto: CreateDocumentDto) {
        return this.prisma.document.create({
            data: {
                orgId,
                creatorId: userId,
                title: dto.title,
                content: dto.content || '{"blocks":[]}', // Initial empty block content
                spaceId: dto.spaceId,
                folderId: dto.folderId,
                parentId: dto.parentId
            },
        });
    }

    async findAll(orgId: string, spaceId?: string, folderId?: string) {
        return this.prisma.document.findMany({
            where: {
                orgId,
                deletedAt: null,
                ...(spaceId && { spaceId }),
                ...(folderId && { folderId }),
            },
            include: { creator: { select: { id: true, name: true, avatarUrl: true } } },
            orderBy: { updatedAt: 'desc' }
        });
    }

    async findOne(orgId: string, documentId: string) {
        const doc = await this.prisma.document.findFirst({
            where: { id: documentId, orgId, deletedAt: null },
            include: {
                creator: { select: { id: true, name: true, avatarUrl: true } },
                children: {
                    select: { id: true, title: true, updatedAt: true }
                }
            }
        });
        if (!doc) throw new NotFoundException('Document not found');
        return doc;
    }

    async update(orgId: string, documentId: string, dto: UpdateDocumentDto) {
        const doc = await this.findOne(orgId, documentId);
        return this.prisma.document.update({
            where: { id: doc.id },
            data: dto
        });
    }

    async remove(orgId: string, documentId: string) {
        const doc = await this.findOne(orgId, documentId);
        // Soft delete the document and its children (simple approach)
        await this.prisma.document.update({
            where: { id: doc.id },
            data: { deletedAt: new Date() }
        });
    }
}
