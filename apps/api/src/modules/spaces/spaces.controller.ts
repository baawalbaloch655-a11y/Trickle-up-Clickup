import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Headers } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SpacesService } from './spaces.service';
import { CreateSpaceDto, UpdateSpaceDto } from './dto/space.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Spaces')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('spaces')
export class SpacesController {
    constructor(private readonly spacesService: SpacesService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new space' })
    create(@Headers('x-org-id') orgId: string, @Body() createSpaceDto: CreateSpaceDto) {
        return this.spacesService.create(orgId, createSpaceDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all spaces in an organization' })
    findAll(@Headers('x-org-id') orgId: string) {
        return this.spacesService.findAll(orgId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get space by ID' })
    findOne(@Headers('x-org-id') orgId: string, @Param('id') id: string) {
        return this.spacesService.findOne(orgId, id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update space' })
    update(@Headers('x-org-id') orgId: string, @Param('id') id: string, @Body() updateSpaceDto: UpdateSpaceDto) {
        return this.spacesService.update(orgId, id, updateSpaceDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete space' })
    remove(@Headers('x-org-id') orgId: string, @Param('id') id: string) {
        return this.spacesService.remove(orgId, id);
    }
}
