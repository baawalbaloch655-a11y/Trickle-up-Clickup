import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDashboardDto, UpdateDashboardDto, CreateWidgetDto, UpdateWidgetDto } from './dto/dashboard.dto';

@Injectable()
export class DashboardsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(orgId: string, dto: CreateDashboardDto) {
        return this.prisma.dashboard.create({
            data: {
                ...dto,
                orgId,
            },
            include: { widgets: true },
        });
    }

    async findAll(orgId: string) {
        return this.prisma.dashboard.findMany({
            where: { orgId },
            include: { widgets: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(orgId: string, id: string) {
        const dashboard = await this.prisma.dashboard.findFirst({
            where: { id, orgId },
            include: { widgets: true },
        });
        if (!dashboard) throw new NotFoundException('Dashboard not found');
        return dashboard;
    }

    async update(orgId: string, id: string, dto: UpdateDashboardDto) {
        await this.findOne(orgId, id);
        return this.prisma.dashboard.update({
            where: { id },
            data: dto,
            include: { widgets: true },
        });
    }

    async remove(orgId: string, id: string) {
        await this.findOne(orgId, id);
        return this.prisma.dashboard.delete({
            where: { id },
        });
    }

    // --- Widgets ---

    async addWidget(orgId: string, dashboardId: string, dto: CreateWidgetDto) {
        await this.findOne(orgId, dashboardId);
        return this.prisma.dashboardWidget.create({
            data: {
                ...dto,
                dashboardId,
                settings: dto.settings || {},
            },
        });
    }

    async updateWidget(orgId: string, dashboardId: string, widgetId: string, dto: UpdateWidgetDto) {
        await this.findOne(orgId, dashboardId);

        const widget = await this.prisma.dashboardWidget.findFirst({
            where: { id: widgetId, dashboardId },
        });
        if (!widget) throw new NotFoundException('Widget not found');

        return this.prisma.dashboardWidget.update({
            where: { id: widgetId },
            data: {
                ...dto,
                settings: dto.settings ? dto.settings : undefined,
            },
        });
    }

    async removeWidget(orgId: string, dashboardId: string, widgetId: string) {
        await this.findOne(orgId, dashboardId);
        const widget = await this.prisma.dashboardWidget.findFirst({
            where: { id: widgetId, dashboardId },
        });
        if (!widget) throw new NotFoundException('Widget not found');

        return this.prisma.dashboardWidget.delete({
            where: { id: widgetId },
        });
    }
}
