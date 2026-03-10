import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Headers, Query } from '@nestjs/common';
import { DocsService } from './docs.service';
import { CreateDocumentDto, UpdateDocumentDto } from './dto/doc.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('docs')
@UseGuards(JwtAuthGuard)
export class DocsController {
    constructor(private readonly docsService: DocsService) { }

    @Post()
    create(
        @Headers('x-org-id') orgId: string,
        @CurrentUser('id') userId: string,
        @Body() dto: CreateDocumentDto
    ) {
        return this.docsService.create(orgId, userId, dto);
    }

    @Get()
    findAll(
        @Headers('x-org-id') orgId: string,
        @Query('spaceId') spaceId?: string,
        @Query('folderId') folderId?: string,
    ) {
        return this.docsService.findAll(orgId, spaceId, folderId);
    }

    @Get(':id')
    findOne(@Headers('x-org-id') orgId: string, @Param('id') id: string) {
        return this.docsService.findOne(orgId, id);
    }

    @Patch(':id')
    update(
        @Headers('x-org-id') orgId: string,
        @Param('id') id: string,
        @Body() dto: UpdateDocumentDto
    ) {
        return this.docsService.update(orgId, id, dto);
    }

    @Delete(':id')
    remove(@Headers('x-org-id') orgId: string, @Param('id') id: string) {
        return this.docsService.remove(orgId, id);
    }
}
