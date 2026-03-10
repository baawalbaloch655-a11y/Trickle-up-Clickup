import {
    Controller, Get, Post, Patch, Delete, Body, Param, Headers, UseGuards, HttpCode, HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto, MoveTaskDto, AddDependencyDto, CreateChecklistDto, CreateChecklistItemDto, UpdateChecklistItemDto } from './dto/task.dto';
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

    @Post(':taskId/dependencies')
    @RequirePermissions('tasks:write')
    @ApiOperation({ summary: 'Add a task dependency' })
    addDependency(
        @Headers('x-org-id') orgId: string,
        @Param('taskId') taskId: string,
        @Body() dto: AddDependencyDto,
    ) {
        return this.service.addDependency(orgId, taskId, dto);
    }

    @Delete(':taskId/dependencies/:dependencyId')
    @RequirePermissions('tasks:write')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Remove a task dependency' })
    removeDependency(
        @Headers('x-org-id') orgId: string,
        @Param('taskId') taskId: string,
        @Param('dependencyId') dependencyId: string,
    ) {
        return this.service.removeDependency(orgId, taskId, dependencyId);
    }

    @Post(':taskId/checklists')
    @RequirePermissions('tasks:write')
    @ApiOperation({ summary: 'Add a checklist to a task' })
    addChecklist(
        @Headers('x-org-id') orgId: string,
        @Param('taskId') taskId: string,
        @Body() dto: CreateChecklistDto,
    ) {
        return this.service.addChecklist(orgId, taskId, dto);
    }

    @Delete(':taskId/checklists/:checklistId')
    @RequirePermissions('tasks:write')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Remove a task checklist' })
    removeChecklist(
        @Headers('x-org-id') orgId: string,
        @Param('taskId') taskId: string,
        @Param('checklistId') checklistId: string,
    ) {
        return this.service.removeChecklist(orgId, taskId, checklistId);
    }

    @Post(':taskId/checklists/:checklistId/items')
    @RequirePermissions('tasks:write')
    @ApiOperation({ summary: 'Add an item to a checklist' })
    addChecklistItem(
        @Headers('x-org-id') orgId: string,
        @Param('taskId') taskId: string,
        @Param('checklistId') checklistId: string,
        @Body() dto: CreateChecklistItemDto,
    ) {
        return this.service.addChecklistItem(orgId, taskId, checklistId, dto);
    }

    @Patch(':taskId/checklists/:checklistId/items/:itemId')
    @RequirePermissions('tasks:write')
    @ApiOperation({ summary: 'Update a checklist item' })
    updateChecklistItem(
        @Headers('x-org-id') orgId: string,
        @Param('taskId') taskId: string,
        @Param('checklistId') checklistId: string,
        @Param('itemId') itemId: string,
        @Body() dto: UpdateChecklistItemDto,
    ) {
        return this.service.updateChecklistItem(orgId, taskId, checklistId, itemId, dto);
    }

    @Delete(':taskId/checklists/:checklistId/items/:itemId')
    @RequirePermissions('tasks:write')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Remove a checklist item' })
    removeChecklistItem(
        @Headers('x-org-id') orgId: string,
        @Param('taskId') taskId: string,
        @Param('checklistId') checklistId: string,
        @Param('itemId') itemId: string,
    ) {
        return this.service.removeChecklistItem(orgId, taskId, checklistId, itemId);
    }
}
