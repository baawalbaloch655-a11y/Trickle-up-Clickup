import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWebhookDto, UpdateWebhookDto } from './dto/webhook.dto';

@Injectable()
export class WebhooksService {
    constructor(private prisma: PrismaService) { }

    async create(orgId: string, data: CreateWebhookDto) {
        return this.prisma.webhook.create({
            data: {
                ...data,
                orgId,
            },
        });
    }

    async findAll(orgId: string) {
        return this.prisma.webhook.findMany({
            where: { orgId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(orgId: string, id: string) {
        const webhook = await this.prisma.webhook.findFirst({
            where: { id, orgId },
        });

        if (!webhook) throw new NotFoundException('Webhook not found');
        return webhook;
    }

    async update(orgId: string, id: string, data: UpdateWebhookDto) {
        await this.findOne(orgId, id); // verify mapping string exists
        return this.prisma.webhook.update({
            where: { id },
            data,
        });
    }

    async remove(orgId: string, id: string) {
        await this.findOne(orgId, id); // verify mapping string exists
        return this.prisma.webhook.delete({
            where: { id },
        });
    }
}
