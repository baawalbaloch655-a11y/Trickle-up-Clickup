import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Headers } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CustomFieldsService } from './custom-fields.service';
import { CreateCustomFieldDto, UpdateCustomFieldDto, SetCustomFieldValueDto } from './dto/custom-field.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Custom Fields')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('custom-fields')
export class CustomFieldsController {
    constructor(private readonly customFieldsService: CustomFieldsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a custom field definition for an org' })
    create(@Headers('x-org-id') orgId: string, @Body() dto: CreateCustomFieldDto) {
        return this.customFieldsService.create(orgId, dto);
    }

    @Get()
    @ApiOperation({ summary: 'List custom fields for org' })
    findAll(@Headers('x-org-id') orgId: string) {
        return this.customFieldsService.findAll(orgId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get custom field definition' })
    findOne(@Headers('x-org-id') orgId: string, @Param('id') id: string) {
        return this.customFieldsService.findOne(orgId, id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update custom field definition' })
    update(@Headers('x-org-id') orgId: string, @Param('id') id: string, @Body() dto: UpdateCustomFieldDto) {
        return this.customFieldsService.update(orgId, id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete custom field definition' })
    remove(@Headers('x-org-id') orgId: string, @Param('id') id: string) {
        return this.customFieldsService.remove(orgId, id);
    }

    @Post(':fieldId/tasks/:taskId')
    @ApiOperation({ summary: 'Set the value of a custom field for a specific task' })
    setValue(
        @Headers('x-org-id') orgId: string,
        @Param('fieldId') fieldId: string,
        @Param('taskId') taskId: string,
        @Body() dto: SetCustomFieldValueDto
    ) {
        return this.customFieldsService.setValue(orgId, fieldId, taskId, dto);
    }
}
