import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Headers } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { CreateWebhookDto, UpdateWebhookDto } from './dto/webhook.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('webhooks')
@UseGuards(JwtAuthGuard)
export class WebhooksController {
    constructor(private readonly webhooksService: WebhooksService) { }

    @Post()
    create(@Headers('x-org-id') orgId: string, @Body() createWebhookDto: CreateWebhookDto) {
        return this.webhooksService.create(orgId, createWebhookDto);
    }

    @Get()
    findAll(@Headers('x-org-id') orgId: string) {
        return this.webhooksService.findAll(orgId);
    }

    @Get(':id')
    findOne(@Headers('x-org-id') orgId: string, @Param('id') id: string) {
        return this.webhooksService.findOne(orgId, id);
    }

    @Patch(':id')
    update(@Headers('x-org-id') orgId: string, @Param('id') id: string, @Body() updateWebhookDto: UpdateWebhookDto) {
        return this.webhooksService.update(orgId, id, updateWebhookDto);
    }

    @Delete(':id')
    remove(@Headers('x-org-id') orgId: string, @Param('id') id: string) {
        return this.webhooksService.remove(orgId, id);
    }
}
