import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Headers } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FoldersService } from './folders.service';
import { CreateFolderDto, UpdateFolderDto } from './dto/folder.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Folders')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('spaces/:spaceId/folders')
export class FoldersController {
    constructor(private readonly foldersService: FoldersService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new folder in a space' })
    create(@Headers('x-org-id') orgId: string, @Param('spaceId') spaceId: string, @Body() createFolderDto: CreateFolderDto) {
        return this.foldersService.create(orgId, spaceId, createFolderDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all folders in a space' })
    findAll(@Param('spaceId') spaceId: string) {
        return this.foldersService.findAllBySpace(spaceId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get folder by ID' })
    findOne(@Headers('x-org-id') orgId: string, @Param('id') id: string) {
        return this.foldersService.findOne(orgId, id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update folder' })
    update(@Headers('x-org-id') orgId: string, @Param('id') id: string, @Body() updateFolderDto: UpdateFolderDto) {
        return this.foldersService.update(orgId, id, updateFolderDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete folder' })
    remove(@Headers('x-org-id') orgId: string, @Param('id') id: string) {
        return this.foldersService.remove(orgId, id);
    }
}
