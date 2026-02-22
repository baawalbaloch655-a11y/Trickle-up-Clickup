import {
    Controller, Get, Post, Patch, Delete, Body, Param, Headers, UseGuards, HttpCode, HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto, MoveTaskDto } from './dto/task.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../../common/decorators/auth.decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Tasks')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'x-org-id', required: true })
@UseGuards(JwtAuthGuard)
@Controller('lists/:listId/tasks')
export class TasksController {
    constructor(private readonly service: TasksService) { }

    @Post()
    @RequirePermissions('tasks:write')
    @ApiOperation({ summary: 'Create a task' })
    create(
        @Headers('x-org-id') orgId: string,
        @Param('listId') listId: string,
        @CurrentUser('id') userId: string,
        @Body() dto: CreateTaskDto,
    ) {
        return this.service.create(orgId, listId, userId, dto);
    }

    @Get()
    @RequirePermissions('tasks:read')
    @ApiOperation({ summary: 'List tasks for a list' })
    findAll(@Headers('x-org-id') orgId: string, @Param('listId') listId: string) {
        return this.service.findAll(orgId, listId);
    }

    @Get(':taskId')
    @RequirePermissions('tasks:read')
    @ApiOperation({ summary: 'Get task details' })
    findOne(@Headers('x-org-id') orgId: string, @Param('taskId') taskId: string) {
        return this.service.findOne(orgId, taskId);
    }

    @Patch(':taskId')
    @RequirePermissions('tasks:write')
    @ApiOperation({ summary: 'Update task' })
    update(@Headers('x-org-id') orgId: string, @Param('taskId') taskId: string, @CurrentUser('id') userId: string, @Body() dto: UpdateTaskDto) {
        return this.service.update(orgId, taskId, userId, dto);
    }

    @Patch(':taskId/move')
    @RequirePermissions('tasks:write')
    @ApiOperation({ summary: 'Move task to different status (Kanban)' })
    move(@Headers('x-org-id') orgId: string, @Param('taskId') taskId: string, @CurrentUser('id') userId: string, @Body() dto: MoveTaskDto) {
        return this.service.move(orgId, taskId, userId, dto);
    }

    @Delete(':taskId')
    @RequirePermissions('tasks:write')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete task' })
    remove(@Headers('x-org-id') orgId: string, @Param('taskId') taskId: string, @CurrentUser('id') userId: string) {
        return this.service.remove(orgId, taskId, userId);
    }
}
