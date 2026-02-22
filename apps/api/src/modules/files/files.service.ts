import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FilesService {
    private readonly logger = new Logger(FilesService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly config: ConfigService,
    ) { }

    // Stub: In production, generate a signed S3 URL via AWS SDK / compatible client
    async getUploadUrl(orgId: string, userId: string, fileName: string, mimeType: string) {
        const key = `${orgId}/${userId}/${Date.now()}-${fileName}`;
        const bucket = this.config.get<string>('S3_BUCKET', 'trickleup-files');
        const endpoint = this.config.get<string>('S3_ENDPOINT', 'https://s3.amazonaws.com');

        // In a real app, use @aws-sdk/client-s3 getSignedUrl here
        const signedUrl = `${endpoint}/${bucket}/${key}?X-Stub-Presigned=true&expires=3600`;

        this.logger.log(`Generated upload URL for ${fileName} by user ${userId}`);
        return {
            uploadUrl: signedUrl,
            key,
            publicUrl: `${endpoint}/${bucket}/${key}`,
            expiresIn: 3600,
        };
    }

    async confirmUpload(
        orgId: string,
        userId: string,
        dto: { key: string; originalName: string; size: number; mimetype: string },
    ) {
        const endpoint = this.config.get<string>('S3_ENDPOINT', 'https://s3.amazonaws.com');
        const bucket = this.config.get<string>('S3_BUCKET', 'trickleup-files');
        return this.prisma.file.create({
            data: {
                orgId,
                uploadedBy: userId,
                key: dto.key,
                url: `${endpoint}/${bucket}/${dto.key}`,
                originalName: dto.originalName,
                size: dto.size,
                mimetype: dto.mimetype,
            },
        });
    }

    async findAll(orgId: string) {
        return this.prisma.file.findMany({
            where: { orgId, deletedAt: null },
            include: { uploader: { select: { id: true, name: true, avatarUrl: true } } },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
    }

    async remove(orgId: string, fileId: string) {
        return this.prisma.file.update({
            where: { id: fileId },
            data: { deletedAt: new Date() },
        });
    }
}
