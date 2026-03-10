import { Controller, Get, Headers, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiHeader } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../../common/decorators/auth.decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Global Tasks')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'x-org-id', required: true })
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class GlobalTasksController {
    constructor(private readonly prisma: PrismaService) { }

    @Get('me')
    @RequirePermissions('tasks:read')
    @ApiOperation({ summary: 'List all tasks for current user across organization' })
    @ApiQuery({ name: 'startDate', required: false, type: String })
    @ApiQuery({ name: 'endDate', required: false, type: String })
    async getMyTasks(
        @Headers('x-org-id') orgId: string,
        @CurrentUser('id') userId: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string
    ) {
        const where: any = {
            orgId,
            assigneeId: userId,
            deletedAt: null
        };

        if (startDate && endDate) {
            where.dueDate = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }

        return this.prisma.task.findMany({
            where,
            include: {
                list: { select: { id: true, name: true, color: true } },
                status: true,
            },
            orderBy: { dueDate: 'asc' }
        });
    }
}
