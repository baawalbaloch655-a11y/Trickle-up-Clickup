import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Headers } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { CreateIntegrationDto, UpdateIntegrationDto } from './dto/integration.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('integrations')
@UseGuards(JwtAuthGuard)
export class IntegrationsController {
    constructor(private readonly integrationsService: IntegrationsService) { }

    @Post()
    create(@Headers('x-org-id') orgId: string, @Body() createIntegrationDto: CreateIntegrationDto) {
        return this.integrationsService.create(orgId, createIntegrationDto);
    }

    @Get('slack/auth')
    getSlackAuthUrl(@Headers('x-org-id') orgId: string) {
        return this.integrationsService.getSlackAuthUrl(orgId);
    }

    @Get('slack/callback')
    handleSlackCallback(@Headers('x-org-id') orgId: string, @Body() body: { code: string }) {
        return this.integrationsService.handleSlackCallback(orgId, body.code);
    }

    @Get('github/auth')
    getGithubAuthUrl(@Headers('x-org-id') orgId: string) {
        return this.integrationsService.getGithubAuthUrl(orgId);
    }

    @Get('github/callback')
    handleGithubCallback(@Headers('x-org-id') orgId: string, @Body() body: { code: string }) {
        return this.integrationsService.handleGithubCallback(orgId, body.code);
    }

    @Get()
    findAll(@Headers('x-org-id') orgId: string) {
        return this.integrationsService.findAll(orgId);
    }

    @Get(':id')
    findOne(@Headers('x-org-id') orgId: string, @Param('id') id: string) {
        return this.integrationsService.findOne(orgId, id);
    }

    @Patch(':id')
    update(@Headers('x-org-id') orgId: string, @Param('id') id: string, @Body() updateIntegrationDto: UpdateIntegrationDto) {
        return this.integrationsService.update(orgId, id, updateIntegrationDto);
    }

    @Delete(':id')
    remove(@Headers('x-org-id') orgId: string, @Param('id') id: string) {
        return this.integrationsService.remove(orgId, id);
    }
}
