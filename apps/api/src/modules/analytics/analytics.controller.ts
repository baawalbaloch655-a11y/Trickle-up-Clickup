import { Controller, Get, Headers, UseGuards, Post, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/auth.decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Analytics')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
    constructor(private readonly service: AnalyticsService) { }

    @Get('dashboard')
    @ApiOperation({ summary: 'Get dashboard stats for org' })
    getDashboard(@Headers('x-org-id') orgId: string) {
        return this.service.getDashboard(orgId);
    }

    @Get('home')
    @ApiOperation({ summary: 'Get aggregated data for user home dashboard' })
    getHome(@CurrentUser('id') userId: string, @Headers('x-org-id') orgId: string) {
        return this.service.getHomeData(userId, orgId);
    }

    @Post('track-view')
    @ApiOperation({ summary: 'Track a viewed resource' })
    trackView(
        @CurrentUser('id') userId: string,
        @Headers('x-org-id') orgId: string,
        @Query('resource') resource: string,
        @Query('resourceId') resourceId: string,
    ) {
        return this.service.trackView(userId, orgId, resource, resourceId);
    }

    @Get('tasks/by-status')
    @ApiOperation({ summary: 'Task count by status' })
    getTasksByStatus(@Headers('x-org-id') orgId: string) {
        return this.service.getTasksByStatus(orgId);
    }

    @Get('tasks/by-priority')
    @ApiOperation({ summary: 'Task count by priority' })
    getTasksByPriority(@Headers('x-org-id') orgId: string) {
        return this.service.getTasksByPriority(orgId);
    }

    @Get('tasks/by-list')
    @ApiOperation({ summary: 'Task breakdown by list with task details' })
    getTasksByList(@Headers('x-org-id') orgId: string) {
        return this.service.getTasksByList(orgId);
    }

    @Get('tasks/by-assignee')
    @ApiOperation({ summary: 'Task summary grouped by assignee' })
    getTasksByAssignee(@Headers('x-org-id') orgId: string) {
        return this.service.getTasksByAssignee(orgId);
    }

    @Get('activity')
    @ApiOperation({ summary: 'Org activity feed' })
    getActivityFeed(@Headers('x-org-id') orgId: string) {
        return this.service.getActivityFeed(orgId);
    }

    @Public()
    @Get('health')
    @ApiOperation({ summary: 'Health check endpoint' })
    health() {
        return this.service.getHealthMetrics();
    }
}
