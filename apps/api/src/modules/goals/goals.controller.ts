import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Headers } from '@nestjs/common';
import { GoalsService } from './goals.service';
import { CreateGoalDto, UpdateGoalDto, CreateGoalTargetDto, UpdateGoalTargetDto } from './dto/goal.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('goals')
@UseGuards(JwtAuthGuard)
export class GoalsController {
    constructor(private readonly goalsService: GoalsService) { }

    @Post()
    create(@Headers('x-org-id') orgId: string, @CurrentUser('id') userId: string, @Body() dto: CreateGoalDto) {
        return this.goalsService.create(orgId, userId, dto);
    }

    @Get()
    findAll(@Headers('x-org-id') orgId: string, @CurrentUser('id') userId: string) {
        return this.goalsService.findAll(orgId, userId);
    }

    @Get(':id')
    findOne(@Headers('x-org-id') orgId: string, @CurrentUser('id') userId: string, @Param('id') id: string) {
        return this.goalsService.findOne(orgId, userId, id);
    }

    @Patch(':id')
    update(@Headers('x-org-id') orgId: string, @CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: UpdateGoalDto) {
        return this.goalsService.update(orgId, userId, id, dto);
    }

    @Delete(':id')
    remove(@Headers('x-org-id') orgId: string, @CurrentUser('id') userId: string, @Param('id') id: string) {
        return this.goalsService.remove(orgId, userId, id);
    }

    @Post(':id/targets')
    addTarget(@Headers('x-org-id') orgId: string, @CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: CreateGoalTargetDto) {
        return this.goalsService.addTarget(orgId, userId, id, dto);
    }

    @Patch(':id/targets/:targetId')
    updateTarget(
        @Headers('x-org-id') orgId: string,
        @CurrentUser('id') userId: string,
        @Param('id') id: string,
        @Param('targetId') targetId: string,
        @Body() dto: UpdateGoalTargetDto
    ) {
        return this.goalsService.updateTarget(orgId, userId, id, targetId, dto);
    }

    @Delete(':id/targets/:targetId')
    removeTarget(
        @Headers('x-org-id') orgId: string,
        @CurrentUser('id') userId: string,
        @Param('id') id: string,
        @Param('targetId') targetId: string
    ) {
        return this.goalsService.removeTarget(orgId, userId, id, targetId);
    }
}
