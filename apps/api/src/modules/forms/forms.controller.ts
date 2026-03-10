import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Headers } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FormsService } from './forms.service';
import { CreateFormDto, UpdateFormDto, FormSubmissionDto } from './dto/form.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/auth.decorators';

@ApiTags('Forms')
@Controller('forms')
export class FormsController {
    constructor(private readonly formsService: FormsService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Create a new external form' })
    create(@Headers('x-org-id') orgId: string, @Body() dto: CreateFormDto) {
        return this.formsService.create(orgId, dto);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'List all forms for an organization' })
    findAll(@Headers('x-org-id') orgId: string) {
        return this.formsService.findAll(orgId);
    }

    @Public()
    @Get(':id')
    @ApiOperation({ summary: 'Publicly get form structure' })
    findOne(@Param('id') id: string) {
        return this.formsService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Update a form' })
    update(@Param('id') id: string, @Body() dto: UpdateFormDto) {
        return this.formsService.update(id, dto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Delete a form' })
    remove(@Param('id') id: string) {
        return this.formsService.remove(id);
    }

    @Public()
    @Post(':id/submit')
    @ApiOperation({ summary: 'Publicly submit a form' })
    submit(@Param('id') id: string, @Body() dto: FormSubmissionDto) {
        return this.formsService.submit(id, dto);
    }
}
