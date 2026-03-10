import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFormDto, UpdateFormDto, FormSubmissionDto } from './dto/form.dto';

@Injectable()
export class FormsService {
    constructor(private prisma: PrismaService) { }

    async create(orgId: string, dto: CreateFormDto) {
        return this.prisma.form.create({
            data: {
                name: dto.name,
                description: dto.description,
                orgId,
                listId: dto.listId,
                settings: dto.settings || {},
                fields: {
                    create: dto.fields.map((f, i) => ({
                        ...f,
                        order: i,
                        options: f.options || {},
                    })),
                },
            },
            include: { fields: true },
        });
    }

    async findAll(orgId: string) {
        return this.prisma.form.findMany({
            where: { orgId },
            include: { fields: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const form = await this.prisma.form.findUnique({
            where: { id },
            include: { fields: true },
        });
        if (!form) throw new NotFoundException('Form not found');
        return form;
    }

    async update(id: string, dto: UpdateFormDto) {
        await this.findOne(id);

        // Simple approach: delete all fields and recreate (or just update basic info)
        // For brevity in this implementation, we'll recreate fields if provided
        return this.prisma.$transaction(async (tx) => {
            if (dto.fields) {
                await tx.formField.deleteMany({ where: { formId: id } });
            }

            return tx.form.update({
                where: { id },
                data: {
                    name: dto.name,
                    description: dto.description,
                    isActive: dto.isActive,
                    settings: dto.settings,
                    fields: dto.fields ? {
                        create: dto.fields.map((f, i) => ({
                            ...f,
                            order: i,
                            options: f.options || {},
                        })),
                    } : undefined,
                },
                include: { fields: true },
            });
        });
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.form.delete({ where: { id } });
    }

    async submit(id: string, dto: FormSubmissionDto) {
        const form = await this.findOne(id);
        if (!form.isActive) throw new BadRequestException('Form is inactive');

        // Logic to map form data to task fields
        const taskData: any = {
            orgId: form.orgId,
            listId: form.listId,
            title: 'New submission', // Default fallback
            description: '',
            creatorId: (await this.prisma.user.findFirst({ where: { email: 'admin@trickleup.io' } }))?.id || '', // System user
        };

        // Get actual status of the list
        const defaultStatus = await this.prisma.status.findFirst({
            where: { OR: [{ listId: form.listId }, { orgId: form.orgId, listId: null }] },
            orderBy: { order: 'asc' }
        });
        taskData.statusId = defaultStatus?.id || '';

        // Map fields
        for (const field of form.fields) {
            const value = dto.data[field.label];
            if (!value && field.required) throw new BadRequestException(`Field ${field.label} is required`);

            if (field.mapping === 'title') {
                taskData.title = String(value);
            } else if (field.mapping === 'description') {
                taskData.description += `${field.label}: ${value}\n`;
            } else if (field.mapping) {
                // Handle Custom Field mapping if needed
            } else {
                // Default to description
                taskData.description += `${field.label}: ${value}\n`;
            }
        }

        return this.prisma.$transaction(async (tx) => {
            const task = await tx.task.create({ data: taskData });

            return tx.formSubmission.create({
                data: {
                    formId: id,
                    data: dto.data,
                    taskId: task.id,
                },
            });
        });
    }
}

import { BadRequestException } from '@nestjs/common';
