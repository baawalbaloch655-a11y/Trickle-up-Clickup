import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Headers } from '@nestjs/common';
import { DashboardsService } from './dashboards.service';
import { CreateDashboardDto, UpdateDashboardDto, CreateWidgetDto, UpdateWidgetDto } from './dto/dashboard.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('dashboards')
@UseGuards(JwtAuthGuard)
export class DashboardsController {
    constructor(private readonly dashboardsService: DashboardsService) { }

    @Post()
    create(@Headers('x-org-id') orgId: string, @Body() createDashboardDto: CreateDashboardDto) {
        return this.dashboardsService.create(orgId, createDashboardDto);
    }

    @Get()
    findAll(@Headers('x-org-id') orgId: string) {
        return this.dashboardsService.findAll(orgId);
    }

    @Get(':id')
    findOne(@Headers('x-org-id') orgId: string, @Param('id') id: string) {
        return this.dashboardsService.findOne(orgId, id);
    }

    @Patch(':id')
    update(@Headers('x-org-id') orgId: string, @Param('id') id: string, @Body() updateDashboardDto: UpdateDashboardDto) {
        return this.dashboardsService.update(orgId, id, updateDashboardDto);
    }

    @Delete(':id')
    remove(@Headers('x-org-id') orgId: string, @Param('id') id: string) {
        return this.dashboardsService.remove(orgId, id);
    }

    // Widgets

    @Post(':id/widgets')
    addWidget(@Headers('x-org-id') orgId: string, @Param('id') id: string, @Body() createWidgetDto: CreateWidgetDto) {
        return this.dashboardsService.addWidget(orgId, id, createWidgetDto);
    }

    @Patch(':id/widgets/:widgetId')
    updateWidget(
        @Headers('x-org-id') orgId: string,
        @Param('id') id: string,
        @Param('widgetId') widgetId: string,
        @Body() updateWidgetDto: UpdateWidgetDto
    ) {
        return this.dashboardsService.updateWidget(orgId, id, widgetId, updateWidgetDto);
    }

    @Delete(':id/widgets/:widgetId')
    removeWidget(
        @Headers('x-org-id') orgId: string,
        @Param('id') id: string,
        @Param('widgetId') widgetId: string
    ) {
        return this.dashboardsService.removeWidget(orgId, id, widgetId);
    }
}
