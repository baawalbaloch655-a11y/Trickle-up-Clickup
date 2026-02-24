import { Controller, Get, Query, Headers, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Search')
@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
    constructor(private readonly searchService: SearchService) { }

    @Get()
    @ApiOperation({ summary: 'Global search across tasks, lists, channels, members, and messages' })
    @ApiQuery({ name: 'q', description: 'Search query string', required: true })
    async search(
        @Headers('x-org-id') orgId: string,
        @Req() req: any,
        @Query('q') query: string,
    ) {
        return this.searchService.globalSearch(orgId, req.user.id, query);
    }
}
