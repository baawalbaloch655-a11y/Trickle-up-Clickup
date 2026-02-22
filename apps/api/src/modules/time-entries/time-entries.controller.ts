import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TimeEntriesService } from './time-entries.service';
import { CreateTimeEntryDto, UpdateTimeEntryDto } from './dto/time-entry.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Time Entries')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('time-entries')
export class TimeEntriesController {
    constructor(private readonly timeEntriesService: TimeEntriesService) { }

    @Post('start')
    @ApiOperation({ summary: 'Start a timer or log manual time' })
    startTimer(@CurrentUser('id') userId: string, @Body() dto: CreateTimeEntryDto) {
        return this.timeEntriesService.startTimer(userId, dto);
    }

    @Patch(':id/stop')
    @ApiOperation({ summary: 'Stop an active timer' })
    stopTimer(@CurrentUser('id') userId: string, @Param('id') id: string) {
        return this.timeEntriesService.stopTimer(userId, id);
    }

    @Get('task/:taskId')
    @ApiOperation({ summary: 'Get all time entries for a task' })
    getTaskTime(@Param('taskId') taskId: string) {
        return this.timeEntriesService.getTaskTime(taskId);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Edit a time entry' })
    update(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: UpdateTimeEntryDto) {
        return this.timeEntriesService.update(userId, id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a time entry' })
    remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
        return this.timeEntriesService.remove(userId, id);
    }
}
