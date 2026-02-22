import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Headers } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TaskCommentsService } from './task-comments.service';
import { CreateTaskCommentDto, UpdateTaskCommentDto } from './dto/task-comment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Task Comments')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('tasks/:taskId/comments')
export class TaskCommentsController {
    constructor(private readonly taskCommentsService: TaskCommentsService) { }

    @Post()
    @ApiOperation({ summary: 'Add a comment to a task' })
    create(
        @Headers('x-org-id') orgId: string,
        @Param('taskId') taskId: string,
        @CurrentUser('id') userId: string,
        @Body() dto: CreateTaskCommentDto
    ) {
        return this.taskCommentsService.create(orgId, taskId, userId, dto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all comments for a task' })
    findAll(@Headers('x-org-id') orgId: string, @Param('taskId') taskId: string) {
        return this.taskCommentsService.findAll(orgId, taskId);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a comment' })
    update(
        @Headers('x-org-id') orgId: string,
        @Param('id') id: string,
        @CurrentUser('id') userId: string,
        @Body() dto: UpdateTaskCommentDto
    ) {
        return this.taskCommentsService.update(orgId, id, userId, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a comment' })
    remove(
        @Headers('x-org-id') orgId: string,
        @Param('id') id: string,
        @CurrentUser('id') userId: string
    ) {
        return this.taskCommentsService.remove(orgId, id, userId);
    }
}
