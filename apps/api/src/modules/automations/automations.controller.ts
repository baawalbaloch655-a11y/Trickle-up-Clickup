import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Headers, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AutomationsService } from './automations.service';
import { CreateAutomationRuleDto, UpdateAutomationRuleDto } from './dto/automation.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Automations')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('automations')
export class AutomationsController {
    constructor(private readonly automationsService: AutomationsService) { }

    @Post()
    @ApiOperation({ summary: 'Create an automation rule' })
    create(@Headers('x-org-id') orgId: string, @Body() dto: CreateAutomationRuleDto) {
        return this.automationsService.create(orgId, dto);
    }

    @Get()
    @ApiOperation({ summary: 'List automation rules' })
    @ApiQuery({ name: 'listId', required: false, type: String })
    findAll(@Headers('x-org-id') orgId: string, @Query('listId') listId?: string) {
        return this.automationsService.findAll(orgId, listId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a specific automation rule' })
    findOne(@Headers('x-org-id') orgId: string, @Param('id') id: string) {
        return this.automationsService.findOne(orgId, id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update an automation rule' })
    update(@Headers('x-org-id') orgId: string, @Param('id') id: string, @Body() dto: UpdateAutomationRuleDto) {
        return this.automationsService.update(orgId, id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete an automation rule' })
    remove(@Headers('x-org-id') orgId: string, @Param('id') id: string) {
        return this.automationsService.remove(orgId, id);
    }
}
