import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Headers } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ListsService } from './lists.service';
import { CreateListDto, UpdateListDto } from './dto/list.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Lists')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('lists')
export class ListsController {
    constructor(private readonly listsService: ListsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new list' })
    create(@Headers('x-org-id') orgId: string, @Body() createListDto: CreateListDto) {
        return this.listsService.create(orgId, createListDto);
    }

    @Get('folder/:folderId')
    @ApiOperation({ summary: 'Get all lists in a folder' })
    findAllByFolder(@Param('folderId') folderId: string) {
        return this.listsService.findAllByFolder(folderId);
    }

    @Get('space/:spaceId')
    @ApiOperation({ summary: 'Get all lists directly in a space' })
    findAllBySpace(@Param('spaceId') spaceId: string) {
        return this.listsService.findAllBySpace(spaceId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get list by ID' })
    findOne(@Headers('x-org-id') orgId: string, @Param('id') id: string) {
        return this.listsService.findOne(orgId, id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update list' })
    update(@Headers('x-org-id') orgId: string, @Param('id') id: string, @Body() updateListDto: UpdateListDto) {
        return this.listsService.update(orgId, id, updateListDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete list' })
    remove(@Headers('x-org-id') orgId: string, @Param('id') id: string) {
        return this.listsService.remove(orgId, id);
    }
}
