import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomFieldDto, UpdateCustomFieldDto, SetCustomFieldValueDto } from './dto/custom-field.dto';

@Injectable()
export class CustomFieldsService {
    constructor(private prisma: PrismaService) { }

    async create(orgId: string, dto: CreateCustomFieldDto) {
        return this.prisma.customField.create({
            data: {
                ...dto,
                orgId,
                options: dto.options ? dto.options : undefined,
            },
        });
    }

    async findAll(orgId: string) {
        return this.prisma.customField.findMany({
            where: { orgId }
        });
    }

    async findOne(orgId: string, id: string) {
        const field = await this.prisma.customField.findUnique({
            where: { id },
        });

        if (!field || field.orgId !== orgId) {
            throw new NotFoundException('Custom field not found');
        }
        return field;
    }

    async update(orgId: string, id: string, dto: UpdateCustomFieldDto) {
        await this.findOne(orgId, id);

        return this.prisma.customField.update({
            where: { id },
            data: dto,
        });
    }

    async remove(orgId: string, id: string) {
        await this.findOne(orgId, id);

        return this.prisma.customField.delete({
            where: { id },
        });
    }

    async setValue(orgId: string, fieldId: string, taskId: string, dto: SetCustomFieldValueDto) {
        await this.findOne(orgId, fieldId); // verify field exists in org

        // Ensure task exists in org
        const task = await this.prisma.task.findUnique({ where: { id: taskId } });
        if (!task || task.orgId !== orgId) throw new NotFoundException("Task not found");

        return this.prisma.customFieldValue.upsert({
            where: {
                taskId_customFieldId: {
                    taskId,
                    customFieldId: fieldId,
                },
            },
            update: {
                value: dto.value !== undefined ? dto.value : null,
            },
            create: {
                taskId,
                customFieldId: fieldId,
                value: dto.value !== undefined ? dto.value : null,
            },
        });
    }
}
