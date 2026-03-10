import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAiOperationDto, UpdateAiOperationDto } from './dto/ai-operation.dto';

@Injectable()
export class AiService {
    constructor(private prisma: PrismaService) { }

    async create(orgId: string, userId: string, data: CreateAiOperationDto) {
        // Here we could simulate a delay or mock OpenAI API call
        // For now, we immediately resolve it with fake text
        const responseText = `[AI Mock] Responding to ${data.action} request:\n\n${data.prompt.substring(0, 50)}...`;

        return this.prisma.aiOperation.create({
            data: {
                orgId,
                userId,
                action: data.action,
                prompt: data.prompt,
                response: responseText,
                tokens: Math.floor(Math.random() * 500) + 50,
                status: 'COMPLETED'
            },
        });
    }

    async findAll(orgId: string) {
        return this.prisma.aiOperation.findMany({
            where: { orgId },
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { name: true, email: true } } }
        });
    }

    async findOne(orgId: string, id: string) {
        const operation = await this.prisma.aiOperation.findFirst({
            where: { id, orgId },
            include: { user: { select: { name: true, email: true } } }
        });

        if (!operation) throw new NotFoundException('AI operation not found');
        return operation;
    }
}
